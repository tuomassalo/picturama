import { PhotoId, PhotoSectionId } from 'common/CommonTypes'
import CancelablePromise, { isCancelError } from 'common/util/CancelablePromise'
import { getMasterPath } from 'common/util/DataUtil'
import { assertRendererProcess } from 'common/util/ElectronUtil'

import BackgroundClient from 'app/BackgroundClient'
import { showError } from 'app/ErrorPresenter'
import {
    setDetailPhotoAction,
    fetchDetailPhotoDataAction,
    closeDetailAction,
    fetchSectionPhotosAction,
} from "app/state/actions"
import { getPhotoByIndex, getPrevPhoto, getNextPhoto, getLoadedSectionById, getPhotoById } from "app/state/selectors"
import store from 'app/state/store'
import { AppState } from 'app/state/StateTypes'
import SerialUpdater from 'app/util/SerialUpdater'
import { FetchState } from 'app/UITypes'


assertRendererProcess()

export function setDetailPhotoById(sectionId: PhotoSectionId, photoId: PhotoId | null) {
    const state = store.getState()
    const section = getLoadedSectionById(state, sectionId)
    const photoIndex = (section && photoId != null) ? section.photoIds.indexOf(photoId) : -1
    setDetailPhotoByIndex(sectionId, (photoIndex === -1) ? null : photoIndex)
}

export function setDetailPhotoByIndex(sectionId: PhotoSectionId | null, photoIndex: number | null) {
    if (sectionId == null || photoIndex == null) {
        store.dispatch(closeDetailAction())
        return
    }

    const state = store.getState()
    const photo = getPhotoByIndex(state, sectionId, photoIndex)
    if (!photo) {
        showError(`No photo at index ${photoIndex}`)
        return
    }

    store.dispatch(setDetailPhotoAction(sectionId, photoIndex, photo.id))
}


new SerialUpdater({
    getUpdateParameters(state: AppState) {
        const detailState = state.detail
        return {
            photo: detailState && getPhotoById(state, detailState.currentPhoto.sectionId, detailState.currentPhoto.photoId),
            needsData: !!(detailState && !detailState.currentPhoto.photoDetail && detailState.currentPhoto.fetchState === FetchState.IDLE)
        }
    },
    async runUpdate({ photo, needsData }) {
        if (photo && needsData) {
            const photoId = photo.id
            store.dispatch(fetchDetailPhotoDataAction.request({ photoId }))
            return new CancelablePromise(Promise.all(
                [
                    BackgroundClient.fetchPhotoDetail(photo.id),
                    BackgroundClient.fetchPhotoWorkOfPhoto(photo)
                ]))
                .then(results => {
                    const [ photoDetail, photoWork ] = results
                    store.dispatch(fetchDetailPhotoDataAction.success({ photoId, photoDetail, photoWork }))
                })
                .catch(error => {
                    if (!isCancelError(error)) {
                        showError('Fetching photo data failed: ' + getMasterPath(photo), error)
                        store.dispatch(fetchDetailPhotoDataAction.failure({ photoId, error }))
                    }
                })
        }
    }
})


export function setPreviousDetailPhoto() {
    const state = store.getState()
    if (state.detail) {
        const currentPhoto = state.detail.currentPhoto
        const currentIndex = currentPhoto.photoIndex
        const prevPhoto = getPrevPhoto(state, currentPhoto.sectionId, currentIndex)
        if (prevPhoto) {
            setDetailPhotoById(prevPhoto.section.id, prevPhoto.photo.id)
        }
    }
}

export function setNextDetailPhoto() {
    const state = store.getState()
    if (state.detail) {
        const currentPhoto = state.detail.currentPhoto
        const currentIndex = currentPhoto.photoIndex
        const nextPhoto = getNextPhoto(state, currentPhoto.sectionId, currentIndex)
        if (nextPhoto) {
            setDetailPhotoById(nextPhoto.section.id, nextPhoto.photo.id)
            if (nextPhoto.preloadSectionId) {
                store.dispatch(
                    fetchSectionPhotosAction(
                        [nextPhoto.preloadSectionId],
                        [
                            /* ?? */
                        ],
                    ),
                )
            }
        }
    }
}
