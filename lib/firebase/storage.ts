"use client";

import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "./client";

/**
 * Upload profile photo from a data URL (e.g. from onboarding step 1).
 * Saves to Storage at users/{userId}/profile.jpg and returns the download URL.
 */
export async function uploadProfilePhoto(userId: string, dataUrl: string): Promise<string> {
  const path = `users/${userId}/profile.jpg`;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, dataUrl, "data_url", {
    contentType: "image/jpeg",
  });
  return getDownloadURL(storageRef);
}
