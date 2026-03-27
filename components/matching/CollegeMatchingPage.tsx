"use client";

import React from "react";
import { CollegeMatchingView } from "./CollegeMatchingView";
import { type ProfileSnapshot } from "./types";

export type { ProfileSnapshot };

export function CollegeMatchingPage(props: { profile: ProfileSnapshot | null }) {
  return React.createElement(CollegeMatchingView, props);
}
