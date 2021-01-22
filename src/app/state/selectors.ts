import { PhotoId, Photo, PhotoSectionId, TagId, isLoadedPhotoSection, LoadedPhotoSection } from 'common/CommonTypes'

import { AppState, DataState } from './StateTypes'


export function getPhotoByIndex(state: AppState, sectionId: PhotoSectionId, photoIndex: number): Photo | null {
    const section = getLoadedSectionById(state, sectionId)
    return (section && section.photoData[section.photoIds[photoIndex]]) || null
}

export function getPrevPhoto(
    state: AppState,
    sectionId: PhotoSectionId,
    currPhotoIndex: number,
): { photo: Photo; section: LoadedPhotoSection } | null {
    if (currPhotoIndex > 0) {
        const section = getLoadedSectionById(state, sectionId)
        return section
            ? {
                  section,
                  photo: section.photoData[section.photoIds[currPhotoIndex - 1]],
              }
            : null
    } else {
        // jump to previous section, if any
        const currSectionIndex = state.data.sections.ids.indexOf(sectionId)
        const prevSectionId: PhotoSectionId = state.data.sections.ids[currSectionIndex - 1]
        const prevSection = getLoadedSectionById(state, prevSectionId)

        return prevSection
            ? {
                  section: prevSection,
                  photo: prevSection.photoData[prevSection.photoIds[prevSection.photoIds.length - 1]],
              }
            : null
    }
}

export function getNextPhoto(
    state: AppState,
    sectionId: PhotoSectionId,
    currPhotoIndex: number,
): { photo: Photo; section: LoadedPhotoSection; preloadSectionId?: PhotoSectionId } | null {
    const section = getLoadedSectionById(state, sectionId)
    if (!section) return null
    if (currPhotoIndex < section.photoIds.length - 1) {
        return section
            ? {
                  section,
                  photo: section.photoData[section.photoIds[currPhotoIndex + 1]],
              }
            : null
    } else {
        // jump to next loaded section, if any
        const currSectionIndex = state.data.sections.ids.indexOf(sectionId)
        const nextSectionId: PhotoSectionId = state.data.sections.ids[currSectionIndex + 1]
        const nextSection = getLoadedSectionById(state, nextSectionId)

        // when moving from section A to B, start preloading section C.
        const nextNextSectionId: PhotoSectionId = state.data.sections.ids[currSectionIndex + 2]

        // Assume that the next section is currently loading.
        // Is this a valid assumption in all cases?
        if (!nextSection) return null

        return {
            section: nextSection,
            preloadSectionId: nextNextSectionId,
            photo: nextSection.photoData[nextSection.photoIds[0]],
        }
    }
}


export function getPhotoById(state: AppState, sectionId: PhotoSectionId, photoId: PhotoId): Photo | null {
    const section = getLoadedSectionById(state, sectionId)
    return section ? section.photoData[photoId] : null
}

export function getLoadedSectionById(state: AppState, sectionId: PhotoSectionId): LoadedPhotoSection | null {
    return getLoadedSectionByIdFromDataState(state.data, sectionId)
}

export function getLoadedSectionByIdFromDataState(dataState: DataState, sectionId: PhotoSectionId): LoadedPhotoSection | null {
    const section = dataState.sections.byId[sectionId]
    return isLoadedPhotoSection(section) ? section : null
}

let prevTagIds: TagId[] = []
let cachedTagTitles: string[] = []
export function getTagTitles(state: AppState): string[] {
    const tagIds = state.data.tags.ids
    if (tagIds !== prevTagIds) {
        const tagById = state.data.tags.byId
        cachedTagTitles = tagIds.map(tagId => tagById[tagId].title)
        prevTagIds = tagIds
    }
    return cachedTagTitles
}
