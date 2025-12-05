"use client"

import type { User } from "./api"

const USER_KEY = "school_assistant_user"

export function saveUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(USER_KEY)
    return data ? JSON.parse(data) : null
  }
  return null
}

export function removeUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY)
  }
}

export function isAuthenticated(): boolean {
  return getUser() !== null
}
