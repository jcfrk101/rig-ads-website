#!/usr/bin/env python3
"""Verify corridor-meta.json against OSM interstate geometry.

Outputs report.json with per-corridor diffs (cities, miles, junctions,
neighbors). Does not modify the source file.
"""
import json, math, os, re, sys, heapq
from collections import defaultdict
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "directory")
CACHE = os.path.join(HERE, "osm-cache")

BUFFER_MI = 10.0
BUFFER_M = BUFFER_MI * 1609.344
REMOVE_MI = 15.0            # only drop a drafted city if farther than this
JUNCTION_M = 1000.0         # dense-point contact threshold (termini end on ramps)
NEIGHBOR_M = 5000.0         # state-segment adjacency threshold
DENSE_SPACING = 140.0       # resample spacing for junction detection
M_PER_DEG_LAT = 111132.0

REF_RE = re.compile(r"^I[-\s]?(\d{1,3})\s?([EWC])?$")

cm = json.load(open(os.path.join(DATA, "corridor-meta.json")))
cities_all = json.load(open(os.path.join(DATA, "cities.json")))

cities_by_state = defaultdict(list)
for c in cities_all:
    cities_by_state[c["state"]].append(c)

corridor_keys = list(cm.keys())
states_needed = sorted(set(k.split("/")[1] for k in corridor_keys))


def parse_state(st):
    """Return {slug: [way, ...]} where way = dict(pts=np.array Nx2 latlon)."""
    path = os.path.join(CACHE, f"{st}.json")
    if not os.path.exists(path):
        return None
    data = json.load(open(path))
    routes = defaultdict(list)
    for el in data.get("elements", []):
        if el.get("type") != "way" or "geometry" not in el:
            continue
        tags = el.get("tags", {})
        refs = [r.strip() for r in tags.get("ref", "").split(";")]
        slugs = set()
        for r in refs:
            m = REF_RE.match(r)
            if m:
                slugs.add(f"i-{m.group(1)}{(m.group(2) or '').lower()}")
        if not slugs:
            continue
        pts = np.array([[g["lat"], g["lon"]] for g in el["geometry"]], dtype=np.float64)
        if len(pts) < 2:
            continue
        way = {"pts": pts, "slugs": slugs}
        for s in slugs:
            routes[s].append(way)
    return routes


def seg_arrays(ways):
    """Concatenate all ways into segment arrays (a_lat, a_lon, b_lat, b_lon)."""
    a, b = [], []
    for w in ways:
        a.append(w["pts"][:-1])
        b.append(w["pts"][1:])
    A = np.vstack(a)
    B = np.vstack(b)
    return A, B


def seg_lengths_m(A, B):
    latm = np.radians((A[:, 0] + B[:, 0]) / 2)
    dy = (B[:, 0] - A[:, 0]) * M_PER_DEG_LAT
    dx = (B[:, 1] - A[:, 1]) * M_PER_DEG_LAT * np.cos(latm)
    return np.hypot(dx, dy)


def point_to_segs_m(lat, lon, A, B):
    """Min distance (m) from point to each segment, local equirect at point."""
    k = M_PER_DEG_LAT * math.cos(math.radians(lat))
    ax = (A[:, 1] - lon) * k; ay = (A[:, 0] - lat) * M_PER_DEG_LAT
    bx = (B[:, 1] - lon) * k; by = (B[:, 0] - lat) * M_PER_DEG_LAT
    dx = bx - ax; dy = by - ay
    L2 = dx * dx + dy * dy
    t = np.where(L2 > 0, -(ax * dx + ay * dy) / np.where(L2 == 0, 1, L2), 0.0)
    t = np.clip(t, 0.0, 1.0)
    px = ax + t * dx; py = ay + t * dy
    return np.hypot(px, py)


def dense_points(ways, with_way_idx=False):
    """Resampled points (~DENSE_SPACING m apart) along all ways."""
    out, owner = [], []
    for wi, w in enumerate(ways):
        pts = w["pts"]
        out.append(pts)
        owner.append(np.full(len(pts), wi))
        A, B = pts[:-1], pts[1:]
        L = seg_lengths_m(A, B)
        for i in np.where(L > DENSE_SPACING)[0]:
            n = int(L[i] // DENSE_SPACING)
            ts = np.linspace(0, 1, n + 2)[1:-1][:, None]
            out.append(A[i] + ts * (B[i] - A[i]))
            owner.append(np.full(n, wi))
    P = np.vstack(out)
    if with_way_idx:
        return P, np.concatenate(owner)
    return P


class PointGrid:
    """Grid index over lat/lon points for nearest-point queries."""

    def __init__(self, P, cell_m=2000.0):
        self.P = P
        self.cell = cell_m
        lat0 = float(P[:, 0].mean())
        self.k = M_PER_DEG_LAT * math.cos(math.radians(lat0))
        self.xy = np.column_stack((P[:, 1] * self.k, P[:, 0] * M_PER_DEG_LAT))
        self.grid = defaultdict(list)
        for i, (x, y) in enumerate(self.xy):
            self.grid[(int(x // cell_m), int(y // cell_m))].append(i)

    def query(self, Q):
        """Min distance from any point of Q to this set; returns (dist, my_idx)."""
        c = self.cell
        qxy = np.column_stack((Q[:, 1] * self.k, Q[:, 0] * M_PER_DEG_LAT))
        best, best_i = np.inf, -1
        for x, y in qxy:
            cx, cy = int(x // c), int(y // c)
            idx = []
            for gx in (cx - 1, cx, cx + 1):
                for gy in (cy - 1, cy, cy + 1):
                    idx.extend(self.grid.get((gx, gy), ()))
            if idx:
                d = np.hypot(self.xy[idx, 0] - x, self.xy[idx, 1] - y)
                j = int(np.argmin(d))
                if d[j] < best:
                    best, best_i = float(d[j]), idx[j]
        return best, best_i


def grid_min_dist(P, Q, cell_m=2000.0, cap=None):
    """Approx min distance (m) between point sets P and Q (lat/lon Nx2)."""
    lat0 = float(P[:, 0].mean())
    k = M_PER_DEG_LAT * math.cos(math.radians(lat0))
    def xy(S):
        return np.column_stack(((S[:, 1]) * k, S[:, 0] * M_PER_DEG_LAT))
    Pxy, Qxy = xy(P), xy(Q)
    grid = defaultdict(list)
    for i, (x, y) in enumerate(Qxy):
        grid[(int(x // cell_m), int(y // cell_m))].append(i)
    best = np.inf
    for x, y in Pxy:
        cx, cy = int(x // cell_m), int(y // cell_m)
        idx = []
        for gx in (cx - 1, cx, cx + 1):
            for gy in (cy - 1, cy, cy + 1):
                idx.extend(grid.get((gx, gy), ()))
        if idx:
            q = Qxy[idx]
            d = np.min(np.hypot(q[:, 0] - x, q[:, 1] - y))
            if d < best:
                best = d
                if cap and best < cap:
                    return best
    return best  # inf means > ~cell_m apart


def straight_m(p, q):
    k = M_PER_DEG_LAT * math.cos(math.radians((p[0] + q[0]) / 2))
    return math.hypot((p[0] - q[0]) * M_PER_DEG_LAT, (p[1] - q[1]) * k)


class RouteGraph:
    """Endpoint graph over ways; positions = healed multi-source dijkstra."""

    def __init__(self, ways, orientation):
        self.ways = ways
        key = lambda p: (round(p[0], 6), round(p[1], 6))
        self.adj = defaultdict(list)  # node -> [(other, weight)]
        self.way_ends = []
        nodes = set()
        for w in ways:
            pts = w["pts"]
            a, b = key(pts[0]), key(pts[-1])
            L = float(seg_lengths_m(pts[:-1], pts[1:]).sum())
            w["len_m"] = L
            self.adj[a].append((b, L))
            self.adj[b].append((a, L))
            self.way_ends.append((a, b))
            nodes.add(a); nodes.add(b)
        self.nodes = list(nodes)
        # origin = extreme endpoint in route direction
        if orientation == "ew":
            self.origin = min(self.nodes, key=lambda n: n[1])
        else:
            self.origin = min(self.nodes, key=lambda n: n[0])
        self.dist = self._healed_dijkstra()
        finite = [d for d in self.dist.values() if d < np.inf]
        self.max_pos = max(finite) if finite else 0.0

    def _dijkstra(self, seeds, dist):
        pq = [(d, n) for n, d in seeds.items()]
        heapq.heapify(pq)
        for n, d in seeds.items():
            if d < dist.get(n, np.inf):
                dist[n] = d
        while pq:
            d, n = heapq.heappop(pq)
            if d > dist.get(n, np.inf):
                continue
            for m, w in self.adj[n]:
                nd = d + w
                if nd < dist.get(m, np.inf):
                    dist[m] = nd
                    heapq.heappush(pq, (nd, m))
        return dist

    def _healed_dijkstra(self):
        dist = {n: np.inf for n in self.nodes}
        # seed everything within 2.5 km of origin (both carriageways at a
        # state line start near each other)
        seeds = {}
        for n in self.nodes:
            d = straight_m(self.origin, n)
            if d < 2500:
                seeds[n] = d
        dist = self._dijkstra(seeds, dist)
        # heal gaps: bridge nearest unreachable node to reachable set
        for _ in range(80):
            un = [n for n in self.nodes if dist[n] == np.inf]
            if not un:
                break
            reach = [(n, d) for n, d in dist.items() if d < np.inf]
            best = None
            for u in un:
                for rn, rd in reach:
                    g = straight_m(u, rn)
                    if best is None or rd + g < best[1]:
                        best = (u, rd + g)
            u, d0 = best
            # seed u's whole vicinity (2.5 km) so its twin carriageway joins too
            seeds = {n: d0 + straight_m(u, n) for n in un if straight_m(u, n) < 2500}
            dist = self._dijkstra(seeds, dist)
        return dist

    def position_of_way(self, wi):
        a, b = self.way_ends[wi]
        return min(self.dist.get(a, np.inf), self.dist.get(b, np.inf))


ORIENT = lambda route: "ew" if int(re.sub(r"\D", "", route)) % 2 == 0 else "ns"

# OSM co-tags future designations onto existing routes; drop known cases
# (I-27's Ports-to-Plains extension is tagged along I-35 at Laredo).
EXCLUDE = {("i-27", "tx"): {"i-35"}}

print("parsing OSM caches...", flush=True)
state_routes = {}
for st in states_needed:
    r = parse_state(st)
    if r is None:
        print(f"  MISSING cache: {st}")
    state_routes[st] = r

report = {}
route_state_dense = {}   # (route, st) -> dense pts for neighbor checks
route_graphs = {}

for key in corridor_keys:
    route, st = key.split("/")
    meta = cm[key]
    routes = state_routes.get(st)
    if not routes:
        report[key] = {"status": "no-osm-cache"}
        continue
    excl = EXCLUDE.get((route, st), set())
    keep = lambda ws: [w for w in ws if not (excl & w["slugs"])]
    mainline = keep(routes.get(route, []))
    branch_ways = keep(routes.get(route + "w", []) + routes.get(route + "e", [])
                       + routes.get(route + "c", []))
    main_ids = {id(w) for w in mainline}
    all_ways = mainline + [w for w in branch_ways if id(w) not in main_ids]
    if not all_ways:
        report[key] = {"status": "no-geometry",
                       "available_routes": sorted(routes.keys())}
        continue

    A, B = seg_arrays(all_ways)
    way_idx = []  # segment -> way index
    for wi, w in enumerate(all_ways):
        way_idx.extend([wi] * (len(w["pts"]) - 1))
    way_idx = np.array(way_idx)

    graph = RouteGraph(all_ways, ORIENT(route))
    route_graphs[key] = graph

    # ---- mileage ----
    # sum/2 of the dual carriageway tracks route logs almost exactly; the
    # graph estimate chord-cuts across tagging gaps. Use sum/2 unless it is
    # way above graph (express/local or C/D lane duplication), then graph.
    # For I-35 the official length runs through the E branch, so include it.
    mile_ways = mainline
    if route == "i-35" and routes.get(route + "e"):
        mile_ways = mainline + routes[route + "e"]
    if not mile_ways:
        mile_ways = all_ways
    mA, mB = seg_arrays(mile_ways)
    sum_half = float(seg_lengths_m(mA, mB).sum()) / 2 / 1609.344
    g2 = graph if mile_ways is all_ways else RouteGraph(mile_ways, ORIENT(route))
    graph_mi = g2.max_pos / 1609.344
    miles, mile_src = sum_half, "sum/2"
    old_mi = meta["approxMiles"]
    if old_mi > 0 and miles < max(5, 0.3 * old_mi):
        # OSM barely tags this route here (e.g. unsigned concurrency);
        # geometry can't verify the drafted mileage, so keep it
        miles, mile_src = old_mi, "kept-draft (osm tagging incomplete)"

    # ---- cities ----
    cities = cities_by_state.get(st, [])
    hits = []
    dists = {}
    for c in cities:
        d = float(np.min(point_to_segs_m(c["lat"], c["lng"], A, B)))
        dists[c["citySlug"]] = d
        if d <= BUFFER_M:
            # position along route via nearest way
            di = point_to_segs_m(c["lat"], c["lng"], A, B)
            near = np.where(di <= d + 800)[0]
            pos = min(graph.position_of_way(int(way_idx[i])) for i in near)
            if pos == np.inf:
                pos = straight_m(graph.origin, (c["lat"], c["lng"]))
            hits.append((pos, c["citySlug"]))
    hits.sort()
    new_cities = [s for _, s in hits]

    old = meta["citiesAlong"]
    # keep drafted borderline cities (10-12 mi): insert at position
    state_slugs = {c["citySlug"] for c in cities}
    for s in old:
        if s in state_slugs and s not in new_cities:
            d = dists.get(s)
            if d is not None and d <= REMOVE_MI * 1609.344:
                c = next(c for c in cities if c["citySlug"] == s)
                di = point_to_segs_m(c["lat"], c["lng"], A, B)
                dmin = float(np.min(di))
                near = np.where(di <= dmin + 800)[0]
                pos = min(graph.position_of_way(int(way_idx[i])) for i in near)
                if pos == np.inf:
                    pos = straight_m(graph.origin, (c["lat"], c["lng"]))
                hits.append((pos, s))
    hits.sort()
    new_cities = [s for _, s in hits]
    added = [s for s in new_cities if s not in old]
    removed = [s for s in old if s not in new_cities]
    report[key] = {
        "status": "ok",
        "ways": len(all_ways),
        "old_miles": meta["approxMiles"],
        "new_miles_raw": round(miles, 1),
        "new_miles": int(round(miles / 5) * 5),
        "mile_src": mile_src,
        "graph_mi": round(graph_mi, 1),
        "sum_half_mi": round(sum_half, 1),
        "old_cities": old,
        "new_cities": new_cities,
        "added": {s: round(dists.get(s, -1) / 1609.344, 1) for s in added},
        "removed": {s: (round(dists[s] / 1609.344, 1) if s in dists else "not-in-state")
                     for s in removed},
    }
    route_state_dense[(route, st)] = dense_points(all_ways)

# ---- corridors where the route never actually enters the state ----
# (e.g. I-91 hugs the VT bank of the Connecticut River; I-59 ends just shy of
# TN). Buffer-test the state's cities against the route's geometry in ALL
# states; keep drafted miles/junctions since there is nothing to measure.
for key in corridor_keys:
    if report[key].get("status") != "no-geometry":
        continue
    route, st = key.split("/")
    borrowed = []
    for st2, routes2 in state_routes.items():
        if routes2 and route in routes2:
            borrowed.extend(routes2[route])
    if not borrowed:
        continue
    A, B = seg_arrays(borrowed)
    hits = []
    dists = {}
    for c in cities_by_state.get(st, []):
        d = float(np.min(point_to_segs_m(c["lat"], c["lng"], A, B)))
        dists[c["citySlug"]] = round(d / 1609.344, 1)
        if d <= BUFFER_M:
            hits.append((d, c["citySlug"]))
    hits.sort()
    new_cities = [s for _, s in hits]
    old = cm[key]["citiesAlong"]
    report[key] = {
        "status": "cross-border",
        "old_miles": cm[key]["approxMiles"],
        "new_miles": cm[key]["approxMiles"],
        "old_cities": old,
        "new_cities": new_cities,
        "added": {s: dists[s] for s in new_cities if s not in old},
        "removed": {s: dists.get(s, "?") for s in old if s not in new_cities},
        "junctions_new": cm[key]["majorJunctions"],
        "junctions_old": cm[key]["majorJunctions"],
        "neighbors_new": cm[key]["neighbors"],
        "neighbors_old": cm[key]["neighbors"],
    }

print("cities+miles done, junctions...", flush=True)

# ---- junctions: per state, contact between route pairs ----
state_dense = defaultdict(dict)  # st -> slug -> dense pts (all slugs incl 3-digit)
for st, routes in state_routes.items():
    if not routes:
        continue
    for slug, ways in routes.items():
        excl = EXCLUDE.get((slug, st), set())
        ways = [w for w in ways if not (excl & w["slugs"])]
        if ways:
            state_dense[st][slug] = dense_points(ways)

def disp(slug):
    m = re.match(r"i-(\d+)([ewc])?$", slug)
    return f"I-{m.group(1)}{(m.group(2) or '').upper()}"

for key in corridor_keys:
    if report[key].get("status") != "ok":
        continue
    route, st = key.split("/")
    P_all = state_dense[st]
    graph = route_graphs[key]
    mine, mine_way = dense_points(graph.ways, with_way_idx=True)
    mygrid = PointGrid(mine)
    ordered = []
    for slug, Q in P_all.items():
        if slug == route:
            continue  # W/E branches of own route still count (split points)
        d, my_i = mygrid.query(Q)
        if d < JUNCTION_M:
            pos = graph.position_of_way(int(mine_way[my_i]))
            ordered.append((pos if pos < np.inf else 0, disp(slug)))
    ordered.sort()
    report[key]["junctions_new"] = [s for _, s in ordered]
    report[key]["junctions_old"] = cm[key]["majorJunctions"]

print("junctions done, neighbors...", flush=True)

# ---- neighbors: adjacency between same-route state segments ----
by_route = defaultdict(list)
for key in corridor_keys:
    if report[key].get("status") == "ok":
        by_route[key.split("/")[0]].append(key.split("/")[1])

for route, sts in by_route.items():
    adj = defaultdict(set)
    for i in range(len(sts)):
        for j in range(i + 1, len(sts)):
            a, b = sts[i], sts[j]
            d = grid_min_dist(route_state_dense[(route, a)],
                              route_state_dense[(route, b)],
                              cell_m=6000.0, cap=NEIGHBOR_M)
            if d < NEIGHBOR_M:
                adj[a].add(b); adj[b].add(a)
    ew = ORIENT(route) == "ew"
    for st in sts:
        P = route_state_dense[(route, st)]
        mean = float(P[:, 1].mean()) if ew else float(P[:, 0].mean())
        me = mean
        prevs = []; nexts = []
        for nb in adj[st]:
            Q = route_state_dense[(route, nb)]
            v = float(Q[:, 1].mean()) if ew else float(Q[:, 0].mean())
            (prevs if v < me else nexts).append((abs(v - me), nb))
        key = f"{route}/{st}"
        report[key]["neighbors_new"] = {
            "prev": min(prevs)[1] if prevs else None,
            "next": min(nexts)[1] if nexts else None,
        }
        report[key]["neighbors_old"] = cm[key]["neighbors"]

json.dump(report, open(os.path.join(HERE, "report.json"), "w"), indent=1)

# ---- summary ----
ok = sum(1 for r in report.values() if r.get("status") == "ok")
print(f"\n{ok}/{len(report)} corridors processed")
for k, r in report.items():
    if r.get("status") != "ok":
        print(f"  PROBLEM {k}: {r.get('status')} {r.get('available_routes','')}")
big = [(k, r) for k, r in report.items() if r.get("status") == "ok"
       and abs(r["new_miles"] - r["old_miles"]) > max(15, 0.2 * r["old_miles"])]
print(f"{len(big)} corridors with mileage off by >20%/15mi")
tot_add = sum(len(r.get("added", {})) for r in report.values())
tot_rem = sum(len(r.get("removed", {})) for r in report.values())
print(f"cities added: {tot_add}, removed: {tot_rem}")
