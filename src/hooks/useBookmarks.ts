'use client'

import { useState, useEffect, useCallback } from 'react'

const BOOKMARKS_KEY = 'study-site-bookmarks'
const NOTES_KEY = 'study-site-notes'

export type BookmarkKey = { questionId: string; examType: 'FE' | 'AP' }

function getBookmarks(): BookmarkKey[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function getNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function noteKey(examType: string, questionId: string): string {
  return `${examType}-${questionId}`
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkKey[]>([])
  const [notes, setNotesState] = useState<Record<string, string>>({})

  useEffect(() => {
    setBookmarks(getBookmarks())
    setNotesState(getNotes())
  }, [])

  const isBookmarked = useCallback(
    (questionId: string, examType: 'FE' | 'AP') =>
      bookmarks.some((b) => b.questionId === questionId && b.examType === examType),
    [bookmarks]
  )

  const toggleBookmark = useCallback((questionId: string, examType: 'FE' | 'AP') => {
    setBookmarks((prev) => {
      const next = prev.some((b) => b.questionId === questionId && b.examType === examType)
        ? prev.filter((b) => !(b.questionId === questionId && b.examType === examType))
        : [...prev, { questionId, examType }]
      if (typeof window !== 'undefined') localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getNote = useCallback(
    (examType: string, questionId: string) => notes[noteKey(examType, questionId)] ?? '',
    [notes]
  )

  const setNote = useCallback((examType: string, questionId: string, text: string) => {
    setNotesState((prev) => {
      const key = noteKey(examType, questionId)
      const next = text ? { ...prev, [key]: text } : { ...prev }
      if (!text) delete next[key]
      if (typeof window !== 'undefined') localStorage.setItem(NOTES_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { bookmarks, isBookmarked, toggleBookmark, getNote, setNote }
}
