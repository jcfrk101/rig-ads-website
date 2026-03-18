"use strict";
(() => {
var exports = {};
exports.id = 660;
exports.ids = [660];
exports.modules = {

/***/ 892:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MyDocument)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(689);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_document__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(859);
/* harmony import */ var _emotion_server_create_instance__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(730);
/* harmony import */ var _utils_createEmotionCache__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(748);
/* harmony import */ var _utils_gtag__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(687);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_emotion_server_create_instance__WEBPACK_IMPORTED_MODULE_3__, _utils_createEmotionCache__WEBPACK_IMPORTED_MODULE_4__]);
([_emotion_server_create_instance__WEBPACK_IMPORTED_MODULE_3__, _utils_createEmotionCache__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);






class MyDocument extends next_document__WEBPACK_IMPORTED_MODULE_2__["default"] {
    render() {
        return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(next_document__WEBPACK_IMPORTED_MODULE_2__.Html, {
            lang: "en",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(next_document__WEBPACK_IMPORTED_MODULE_2__.Head, {
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("meta", {
                            charSet: "utf-8"
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("meta", {
                            name: "theme-color",
                            content: "#323E48"
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("link", {
                            rel: "icon",
                            href: "/favicon.ico"
                        }),
                        !!_utils_gtag__WEBPACK_IMPORTED_MODULE_5__/* .GTAG_ID */ .uv && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("script", {
                                    async: true,
                                    src: `https://www.googletagmanager.com/gtag/js?id=${_utils_gtag__WEBPACK_IMPORTED_MODULE_5__/* .GTAG_ID */ .uv}`
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("script", {
                                    dangerouslySetInnerHTML: {
                                        __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${_utils_gtag__WEBPACK_IMPORTED_MODULE_5__/* .GTAG_ID */ .uv}');
                  `
                                    }
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("body", {
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(next_document__WEBPACK_IMPORTED_MODULE_2__.Main, {}),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(next_document__WEBPACK_IMPORTED_MODULE_2__.NextScript, {})
                    ]
                })
            ]
        });
    }
    static async getInitialProps(ctx) {
        const originalRenderPage = ctx.renderPage;
        const cache = (0,_utils_createEmotionCache__WEBPACK_IMPORTED_MODULE_4__/* ["default"] */ .Z)();
        const { extractCriticalToChunks  } = (0,_emotion_server_create_instance__WEBPACK_IMPORTED_MODULE_3__["default"])(cache);
        ctx.renderPage = ()=>originalRenderPage({
                enhanceApp: (App)=>function EnhancedApp(props) {
                        return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(App, {
                            emotionCache: cache,
                            ...props
                        });
                    }
            })
        ;
        const initialProps = await next_document__WEBPACK_IMPORTED_MODULE_2__["default"].getInitialProps(ctx);
        const emotionStyles = extractCriticalToChunks(initialProps.html);
        const emotionStyleTags = emotionStyles.styles.map((style)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("style", {
                "data-emotion": `${style.key} ${style.ids.join(" ")}`,
                dangerouslySetInnerHTML: {
                    __html: style.css
                }
            }, style.key)
        );
        return {
            ...initialProps,
            styles: [
                ...react__WEBPACK_IMPORTED_MODULE_1___default().Children.toArray(initialProps.styles),
                ...emotionStyleTags
            ]
        };
    }
};

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 748:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Z": () => (/* binding */ createEmotionCache)
/* harmony export */ });
/* harmony import */ var _emotion_cache__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(440);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_emotion_cache__WEBPACK_IMPORTED_MODULE_0__]);
_emotion_cache__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];

function createEmotionCache() {
    return (0,_emotion_cache__WEBPACK_IMPORTED_MODULE_0__["default"])({
        key: "css",
        prepend: true
    });
};

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 687:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "s0": () => (/* binding */ fireCallConversion),
/* harmony export */   "uv": () => (/* binding */ GTAG_ID)
/* harmony export */ });
/* unused harmony export GTAG_CALL_CONVERSION */
// Google Ads tag ID — format: AW-XXXXXXXXXX
const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID ?? "";
// Conversion label for the call CTA — format: XXXXXXXXXXXX/YYYYYYYYYYYYYYY
const GTAG_CALL_CONVERSION = process.env.NEXT_PUBLIC_GTAG_CALL_CONVERSION ?? "";
function fireCallConversion() {
    if (true) return;
    window.gtag("event", "conversion", {
        send_to: `${GTAG_ID}/${GTAG_CALL_CONVERSION}`
    });
}


/***/ }),

/***/ 140:
/***/ ((module) => {

module.exports = require("next/dist/server/get-page-files.js");

/***/ }),

/***/ 716:
/***/ ((module) => {

module.exports = require("next/dist/server/htmlescape.js");

/***/ }),

/***/ 368:
/***/ ((module) => {

module.exports = require("next/dist/server/utils.js");

/***/ }),

/***/ 724:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/constants.js");

/***/ }),

/***/ 796:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/head-manager-context.js");

/***/ }),

/***/ 743:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/html-context.js");

/***/ }),

/***/ 524:
/***/ ((module) => {

module.exports = require("next/dist/shared/lib/is-plain-object.js");

/***/ }),

/***/ 689:
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ 997:
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ }),

/***/ 440:
/***/ ((module) => {

module.exports = import("@emotion/cache");;

/***/ }),

/***/ 730:
/***/ ((module) => {

module.exports = import("@emotion/server/create-instance");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [859], () => (__webpack_exec__(892)));
module.exports = __webpack_exports__;

})();