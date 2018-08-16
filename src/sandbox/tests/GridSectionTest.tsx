import React from 'react'
import createLayout from 'justified-layout'

import {addSection, action} from '../core/UiTester'
import { testPhoto, testPanoramaPhoto, testUprightPhoto } from '../util/MockData'
import { createSection, createRandomDummyPhoto } from '../util/TestUtil'

import CancelablePromise from '../../common/util/CancelablePromise'
import { PhotoType, PhotoSectionId, PhotoSection } from '../../common/models/Photo'

import { JustifiedLayoutResult } from '../../ui/UITypes'
import GridSection from '../../ui/components/library/GridSection'
import { getNonRawImgPath } from '../../ui/controller/ImageProvider'


const containerWidth = 800
const scrollBarWidth = 20

const defaultSectionId: PhotoSectionId = '2018-08-15'
const defaultPhotos = [ testPhoto, testUprightPhoto, testPanoramaPhoto ]
const defaultSection = createSection(defaultSectionId, defaultPhotos)
const defaultLayout = createLayoutFromSection(defaultSection)


const defaultProps = {
    section: defaultSection,
    layout: defaultLayout,
    selectedPhotoIds: null,
    getThumbnailSrc: (photo: PhotoType) => getNonRawImgPath(photo),
    createThumbnail: (photo: PhotoType) => {
        const thumbnailPath = getNonRawImgPath(photo)
        if (thumbnailPath === 'dummy') {
            return new CancelablePromise<string>(() => {})
        } else {
            return new CancelablePromise<string>(Promise.resolve(thumbnailPath))
        }
    },
    onPhotoClick: action('onPhotoClick'),
    onPhotoDoubleClick: action('onPhotoDoubleClick'),
}


addSection('GridSection')
    .setArenaStyle({ width: containerWidth, padding: 0, backgroundColor: '#cfd8dc', overflowY: 'auto' })
    .add('normal', context => (
        <GridSection
            {...defaultProps}
        />
    ))
    .add('selection', context => (
        <GridSection
            {...defaultProps}
            selectedPhotoIds={[ testUprightPhoto.id ]}
        />
    ))
    .add('creating thumbnails', context => {
        let photos = [ ...defaultPhotos ]
        for (let i = 0; i < 20; i++) {
            photos.push(createRandomDummyPhoto())
        }
        photos[0] = { ...photos[0], id: photos[0] + '_dummy', master: 'dummy' }
        const section = createSection(defaultSectionId, photos)
        const layout = createLayoutFromSection(section)

        return (
            <GridSection
                {...defaultProps}
                section={section}
                layout={layout}
            />
        )
    })
    .add('placeholder', context => (
        <div>
            <GridSection
                {...defaultProps}
                section={{
                    id: defaultSectionId,
                    title: defaultSectionId,
                    count: 14
                }}
                layout={{ containerHeight: 550 }}
                selectedPhotoIds={null}
            />
            <div style={{ backgroundColor: 'gray', padding: 5 }}>
                Below section
            </div>
        </div>
    ))


function createLayoutFromSection(section: PhotoSection): JustifiedLayoutResult {
    const aspects = section.photoIds.map(photoId => {
        const photo = section.photoData[photoId]
        return photo.master_width / photo.master_height
    })
    return createLayout(aspects, { containerWidth: containerWidth - scrollBarWidth })
}
    