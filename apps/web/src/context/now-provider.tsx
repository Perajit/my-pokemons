"use client";

import { createContext, useContext, useEffect, useState } from "react";

const NowContext = createContext<Date>(new Date());

export function NowProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

export function useNow(): Date {
  return useContext(NowContext);
}
