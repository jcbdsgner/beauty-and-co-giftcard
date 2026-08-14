"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Registered once at module scope, on the client only — never during SSR.
gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, useGSAP, ScrollTrigger };
