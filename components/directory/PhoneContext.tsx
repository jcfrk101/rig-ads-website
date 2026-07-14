import { createContext, useContext } from 'react'
import { PagePhone, TOLLFREE_PHONE } from '../../data/directory/statePhones'

// One phone number per page: state-scoped pages provide their local DNI
// number via DirectoryLayout; every CTA (nav, banner, listing buttons,
// footer, popup) reads it from here so the page never mixes numbers.
const PhoneContext = createContext<PagePhone>(TOLLFREE_PHONE)

export const PhoneProvider = PhoneContext.Provider
export const usePhone = () => useContext(PhoneContext)
