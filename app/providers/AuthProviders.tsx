/*
Use the provider in route.ts to create an element <SessionProvider> that wraps its children
Imported in layout.tsx, added inside the <body> tag to give the whole app access to the auth session
*/

"use client"  // designate a component as a Client Component (interactive and runs in browser)
import React from "react"
import { SessionProvider } from "next-auth/react"

/*
defines a React component called AuthProvider that wraps the Session in it
- children = some Javascript HTML
*/
function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider> // Wraps children in SessionProvider, giving children access to the Session
}

// exports AuthProvider so it can be used in layout.tsx
export default AuthProvider
