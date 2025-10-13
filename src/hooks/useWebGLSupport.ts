"use client";

import { useEffect, useState } from "react";

export const useWebGLSupport = () => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

        setHasWebGL(!!gl);
      } catch (e) {
        console.warn("WebGL detection failed:", e);
        setHasWebGL(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkWebGLSupport();
  }, []);

  return { hasWebGL, isChecking };
};
