import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Image,
  Platform,
  PermissionsAndroid,
  Alert,
  Modal,
  Keyboard,
} from 'react-native';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button } from '@shared/components';
import { useAppDispatch, useAppSelector } from '@core/store/hooks';
import { store } from '@core/store';
import {
  removePhoto,
  replacePhoto,
  appendPhotos,
  setTitle as setAlbumTitle,
  setCoverText,
  setFotosPorPagina,
} from '@core/store/slices/albumSlice';
import { deleteRemotePhoto } from '@core/api';
import { getErrorMessage } from '@core/api/errors';
import { PhotoActionSheet } from './components/PhotoActionSheet';
import { LayoutSelector } from './components/LayoutSelector';
import { OpenBookSpread, ClosedBookCover } from './components/OpenBookSpread';
import { ReplacePhotoPicker } from './components/ReplacePhotoPicker';
import { FilterPickerModal } from './components/FilterPickerModal';
import { BookPageCurl } from './components/BookPageCurl';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import { PageData, LayoutType, FilterType, PagePhoto, DisenoPagina, disenoFromLayout } from './types';
import { reverseGeocode } from './geocoding';
import {
  distributePhotosToPages,
  placePhotosAcrossPages,
  countAvailablePhotoSlots,
  ensureAllPhotosOnPages,
  redistributePagesWithDesign,
} from './utils';
import {
  saveAlbumPages,
  loadAlbumPages,
  loadAlbumTitle,
  persistEditorState,
  loadCoverText,
  getCoverTextFromPages,
} from './storage';

const EMPTY_PHOTOS: string[] = [];

interface EditorScreenProps {
  albumTitle: string;
  photoCount: number;
  pageCount: number;
  onSave: () => void | Promise<void>;
  onBuy: () => void;
  onBack: () => void;
  onAddPhotos: () => void;
}

type EditorTab = 'textos' | 'datos';

export function EditorScreen({
  albumTitle,
  photoCount,
  pageCount,
  onSave,
  onBuy,
  onBack,
  onAddPhotos,
}: EditorScreenProps) {
  const dispatch = useAppDispatch();
  const album = useAppSelector(state => state.album);
  const photos = album.currentAlbum?.photos ?? EMPTY_PHOTOS;
  const pagesInitializedRef = useRef(false);

  const [pages, setPages] = useState<PageData[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [title, setTitle] = useState(albumTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('textos');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [showReplacePicker, setShowReplacePicker] = useState(false);
  const [showFillEmptyPicker, setShowFillEmptyPicker] = useState(false);
  const [fillEmptyPageIndex, setFillEmptyPageIndex] = useState<number | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const locationRequestRef = useRef(0);
  const photosCountRef = useRef(photos.length);
  const skipNextPhotosSyncRef = useRef(false);

  const albumKey = album.currentAlbum?.remoteId || 'local';

  useEffect(() => {
    pagesInitializedRef.current = false;
    setPages([]);
    setCurrentPage(0);
  }, [albumKey]);

  // Initialize pages once: load from storage or distribute from photos
  useEffect(() => {
    if (pagesInitializedRef.current) return;

    const initPages = async () => {
      const savedPages = await loadAlbumPages(albumKey);
      const savedTitle = await loadAlbumTitle();
      const storedCoverText = await loadCoverText(albumKey);

      if (savedPages && savedPages.length > 0) {
        let reconciled = ensureAllPhotosOnPages(savedPages, photos);

        // Restore cover text if pages lost it (e.g. after cloud rebuild)
        if (storedCoverText) {
          const coverIdx = reconciled.findIndex(p => p.id === 'page-cover');
          const idx = coverIdx >= 0 ? coverIdx : 0;
          if (!(reconciled[idx]?.text?.content || '').trim()) {
            reconciled = reconciled.map((page, i) =>
              i === idx
                ? {
                    ...page,
                    text: {
                      ...page.text,
                      content: storedCoverText,
                    },
                  }
                : page,
            );
          }
        }

        setPages(reconciled);
        if (savedTitle) setTitle(savedTitle);
        pagesInitializedRef.current = true;
        photosCountRef.current = photos.length;
        return;
      }

      if (photos.length === 0) return;

      const coverPage: PageData = {
        id: 'page-cover',
        photos: [],
        layout: 'single' as LayoutType,
        text: {
          content: storedCoverText,
          fontSize: 14,
          alignment: 'center' as const,
        },
        stickers: [],
      };

      const distributed = distributePhotosToPages(photos, pageCount);
      setPages([coverPage, ...distributed]);
      pagesInitializedRef.current = true;
      photosCountRef.current = photos.length;
    };

    void initPages();
  }, [photos, pageCount, albumKey]);

  // When album photos grow after init, merge onto pages (or rebuild if pages lag behind)
  useEffect(() => {
    if (!pagesInitializedRef.current) return;
    if (photos.length <= photosCountRef.current) {
      photosCountRef.current = photos.length;
      return;
    }

    if (skipNextPhotosSyncRef.current) {
      skipNextPhotosSyncRef.current = false;
      photosCountRef.current = photos.length;
      return;
    }

    const reloadPages = async () => {
      const savedPages = await loadAlbumPages(albumKey);
      const base = savedPages && savedPages.length > 0 ? savedPages : pages;
      const reconciled = ensureAllPhotosOnPages(base, photos);
      setPages(reconciled);
      photosCountRef.current = photos.length;
    };

    void reloadPages();
  }, [photos.length]);

  const isCoverPage = currentPage === 0;
  const currentPageData = pages[currentPage];

  // Auto-save pages + cover text when they change
  useEffect(() => {
    if (pages.length > 0) {
      void persistEditorState({ pages, title, albumKey });
    }
  }, [pages, title, albumKey]);

  // Update text for current page
  const updatePageText = useCallback(
    (text: string) => {
      setPages(prev =>
        prev.map((page, i) =>
          i === currentPage
            ? { ...page, text: { ...page.text, content: text } }
            : page,
        ),
      );
    },
    [currentPage],
  );

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const coverText = getCoverTextFromPages(pages);
      const nextTitle = title.trim() || albumTitle || 'Mi álbum';
      dispatch(setAlbumTitle(nextTitle));
      dispatch(setCoverText(coverText));
      await persistEditorState({ pages, title: nextTitle, albumKey });
      await onSave();

      const remoteId = store.getState().album.currentAlbum?.remoteId;
      if (remoteId && remoteId !== albumKey) {
        await persistEditorState({
          pages,
          title: nextTitle,
          albumKey: remoteId,
        });
      }
    } catch (error) {
      Alert.alert(
        'No se pudo guardar',
        getErrorMessage(error, 'Intenta de nuevo.'),
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    dispatch,
    title,
    albumTitle,
    pages,
    albumKey,
    onSave,
  ]);

  // Navigation
  const goToPrevPage = useCallback(() => {
    setCurrentPage(page => Math.max(0, page - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(page => Math.min(pages.length - 1, page + 1));
  }, [pages.length]);

  const closePhotoActions = useCallback(() => {
    setShowPhotoActions(false);
    setSelectedPhotoIndex(null);
  }, []);

  const storedDesign = album.currentAlbum?.fotosPorPagina;
  const currentDesign: DisenoPagina =
    storedDesign === 1 ||
    storedDesign === 2 ||
    storedDesign === 3 ||
    storedDesign === 4
      ? storedDesign
      : currentPageData && !isCoverPage
        ? disenoFromLayout(currentPageData.layout)
        : 1;

  const handleSelectDesign = useCallback(
    (design: DisenoPagina) => {
      dispatch(setFotosPorPagina(design));
      const next = redistributePagesWithDesign(pages, photos, design);
      setPages(next);
      setCurrentPage(page => Math.min(page, Math.max(0, next.length - 1)));
    },
    [dispatch, pages, photos],
  );

  const openPhotoActions = useCallback((photoIndex: number) => {
    setSelectedPhotoIndex(photoIndex);
    setShowPhotoActions(true);
  }, []);

  const handleOpenFilter = useCallback(() => {
    setShowPhotoActions(false);
    setShowFilterPicker(true);
  }, []);

  const handleOpenReplace = useCallback(() => {
    setShowPhotoActions(false);
    setShowReplacePicker(true);
  }, []);

  const applyFilterToPhoto = useCallback(
    (filter: FilterType) => {
      if (selectedPhotoIndex === null) return;

      setPages(prev =>
        prev.map((page, pageIndex) => {
          if (pageIndex !== currentPage) return page;
          return {
            ...page,
            photos: page.photos.map((photo, index) =>
              index === selectedPhotoIndex ? { ...photo, filter } : photo,
            ),
          };
        }),
      );
    },
    [currentPage, selectedPhotoIndex],
  );

  const replacePhotoOnPage = useCallback(
    (uris: string[]) => {
      if (selectedPhotoIndex === null || uris.length === 0) return;

      const newUri = uris[0];
      const oldUri = pages[currentPage]?.photos[selectedPhotoIndex]?.uri;
      if (!oldUri || oldUri === newUri) {
        setShowReplacePicker(false);
        setSelectedPhotoIndex(null);
        return;
      }

      setPages(prev =>
        prev.map((page, pageIndex) => {
          if (pageIndex !== currentPage) return page;
          return {
            ...page,
            photos: page.photos.map((photo, index) =>
              index === selectedPhotoIndex
                ? { ...photo, uri: newUri, filter: 'none' }
                : photo,
            ),
          };
        }),
      );

      dispatch(replacePhoto({ oldUri, newUri }));
      setShowReplacePicker(false);
      setSelectedPhotoIndex(null);
    },
    [currentPage, dispatch, pages, selectedPhotoIndex],
  );

  const resolveLayoutFromCount = useCallback((count: number): LayoutType => {
    if (count <= 1) return 'single';
    if (count === 2) return 'grid-2';
    if (count === 3) return 'collage';
    return 'grid-4';
  }, []);

  const handleEmptyPagePress = useCallback((pageIndex: number) => {
    setCurrentPage(pageIndex);
    setFillEmptyPageIndex(pageIndex);
    setShowFillEmptyPicker(true);
  }, []);

  const fillEmptyPageWithPhotos = useCallback(
    (uris: string[]) => {
      if (fillEmptyPageIndex === null || uris.length === 0) return;

      const startPageIndex = fillEmptyPageIndex;
      const maxSelectable = countAvailablePhotoSlots(pages, startPageIndex);
      const selected = uris.slice(0, maxSelectable);
      if (selected.length === 0) return;

      const newlyAdded = selected.filter(uri => !photos.includes(uri)).length;

      setPages(prev => {
        const next = placePhotosAcrossPages(prev, selected, startPageIndex);
        void saveAlbumPages(next, albumKey);
        return next;
      });

      // Evita que el sync por photos.length recargue storage viejo y borre el cambio.
      skipNextPhotosSyncRef.current = true;
      photosCountRef.current = photos.length + newlyAdded;
      dispatch(appendPhotos(selected));

      setShowFillEmptyPicker(false);
      setFillEmptyPageIndex(null);
    },
    [dispatch, fillEmptyPageIndex, pages, photos],
  );

  const handleSpreadPhotoPress = useCallback(
    (pageIndex: number, photoIndex: number) => {
      setCurrentPage(pageIndex);
      openPhotoActions(photoIndex);
    },
    [openPhotoActions],
  );

  const removePhotoFromPage = useCallback(
    async (photoIndex: number) => {
      const photoUri = pages[currentPage]?.photos[photoIndex]?.uri;
      if (!photoUri) return;

      const remoteFotoId = album.currentAlbum?.remoteFotos?.[photoUri];

      const performDelete = async () => {
        if (remoteFotoId) {
          setIsDeletingPhoto(true);
          try {
            await deleteRemotePhoto(remoteFotoId);
          } catch (error) {
            Alert.alert(
              'Error',
              getErrorMessage(error, 'No se pudo eliminar la foto en la nube'),
            );
            return;
          } finally {
            setIsDeletingPhoto(false);
          }
        }

        setPages(prev =>
          prev.map((page, pageIndex) => {
            if (pageIndex !== currentPage) return page;
            const photos = page.photos
              .filter((_, index) => index !== photoIndex)
              .map((photo, order) => ({ ...photo, order }));
            return {
              ...page,
              photos,
              layout: resolveLayoutFromCount(photos.length),
            };
          }),
        );

        dispatch(removePhoto(photoUri));
        closePhotoActions();
      };

      if (remoteFotoId) {
        Alert.alert(
          'Eliminar foto',
          'Se quitará de esta página y del álbum en la nube.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: performDelete },
          ],
        );
        return;
      }

      await performDelete();
    },
    [
      album.currentAlbum?.remoteFotos,
      closePhotoActions,
      currentPage,
      dispatch,
      pages,
      resolveLayoutFromCount,
    ],
  );

  const movePhotoOnPage = useCallback(
    (direction: 'left' | 'right') => {
      if (selectedPhotoIndex === null) return;

      const targetIndex =
        direction === 'left' ? selectedPhotoIndex - 1 : selectedPhotoIndex + 1;
      const pagePhotos = pages[currentPage]?.photos ?? [];
      if (targetIndex < 0 || targetIndex >= pagePhotos.length) return;

      setPages(prev =>
        prev.map((page, pageIndex) => {
          if (pageIndex !== currentPage) return page;

          const nextPhotos = [...page.photos];
          [nextPhotos[selectedPhotoIndex], nextPhotos[targetIndex]] = [
            nextPhotos[targetIndex],
            nextPhotos[selectedPhotoIndex],
          ];

          return {
            ...page,
            photos: nextPhotos.map((photo, order) => ({ ...photo, order })),
          };
        }),
      );

      setSelectedPhotoIndex(targetIndex);
      closePhotoActions();
    },
    [closePhotoActions, currentPage, pages, selectedPhotoIndex],
  );

  const renderBookPreview = () => (
    <BookPageCurl
      currentPage={currentPage}
      pageCount={pages.length}
      onPrev={goToPrevPage}
      onNext={goToNextPage}
      renderPage={pageIndex => {
        if (pageIndex === 0) {
          return (
            <ClosedBookCover
              page={pages[0]}
              fallbackCoverPhoto={photos[0]}
              onPhotoPress={() => openPhotoActions(0)}
            />
          );
        }

        // Spreads: [1|2], [3|4], ... Last odd page sits alone on the left.
        const interior = Math.max(1, pageIndex);
        const left = interior % 2 === 1 ? interior : interior - 1;
        const hasRightPage = left + 1 < pages.length;
        const right = hasRightPage ? left + 1 : -1;

        return (
          <OpenBookSpread
            leftPage={pages[left]}
            rightPage={hasRightPage ? pages[right] : undefined}
            leftPageIndex={left}
            rightPageIndex={right}
            activePageIndex={pageIndex}
            onPhotoPress={handleSpreadPhotoPress}
            onEmptyPagePress={handleEmptyPagePress}
          />
        );
      }}
    />
  );

  const closeLocationInput = useCallback(() => {
    locationRequestRef.current += 1;
    setShowLocationInput(false);
    setLocationText('');
    setIsLoadingLocation(false);
    Keyboard.dismiss();
  }, []);

  const openLocationInput = useCallback(() => {
    locationRequestRef.current += 1;
    setLocationText('');
    setShowLocationInput(true);
    fetchCurrentLocation(locationRequestRef.current);
  }, []);

  const confirmLocation = useCallback(() => {
    const trimmed = locationText.trim();
    if (!trimmed) return;

    const current = pages[currentPage]?.text.content || '';
    closeLocationInput();
    updatePageText(current ? `${current}\n${trimmed}` : trimmed);
  }, [locationText, pages, currentPage, closeLocationInput, updatePageText]);

  // Geolocation: autocomplete location field
  const fetchCurrentLocation = (requestId?: number) => {
    const activeRequestId = requestId ?? ++locationRequestRef.current;
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === 'android') {
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then(granted => {
          if (activeRequestId !== locationRequestRef.current) return;

          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación.');
            setIsLoadingLocation(false);
            return;
          }

          requestDeviceLocation(activeRequestId);
        });
        return;
      }

      requestDeviceLocation(activeRequestId);
    } catch {
      if (activeRequestId !== locationRequestRef.current) return;
      Alert.alert('Error', 'No se pudo acceder a la ubicación.');
      setIsLoadingLocation(false);
    }
  };

  const requestDeviceLocation = (requestId: number) => {
    Geolocation.getCurrentPosition(
      async (position) => {
        if (requestId !== locationRequestRef.current) return;

        const { latitude, longitude } = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          if (requestId !== locationRequestRef.current) return;
          setLocationText(address);
        } catch {
          if (requestId !== locationRequestRef.current) return;
          Alert.alert(
            'Sin dirección',
            'No pudimos convertir tu ubicación a una dirección. Escríbela manualmente.',
          );
        }
        if (requestId !== locationRequestRef.current) return;
        setIsLoadingLocation(false);
      },
      () => {
        if (requestId !== locationRequestRef.current) return;
        Alert.alert('Error', 'No se pudo obtener la ubicación. Escríbela manualmente.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  };

  return (
    <LinearGradient
      colors={['#F5F8FA', '#EDE8E3']}
      style={styles.container}>
      {/* Header */}
      <Text style={styles.headerTitle}>Editando</Text>

      {/* Title */}
      <View style={styles.titleContainer}>
        {isEditingTitle ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            onBlur={() => setIsEditingTitle(false)}
            autoFocus
            accessibilityLabel="Editar título del álbum"
          />
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditingTitle(true)}
            style={styles.titleRow}
            accessibilityLabel={`Título: ${title}. Toca para editar.`}
            accessibilityRole="button">
            <Text style={styles.title}>{title}</Text>
            <Image
              source={icons.new}
              style={{ width: 18, height: 18, tintColor: colors.text.secondary }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {photoCount} fotos · {Math.max(pageCount, Math.max(0, pages.length - 1))} páginas
          </Text>
          <TouchableOpacity
            style={styles.addPhotosChip}
            onPress={onAddPhotos}
            accessibilityLabel="Agregar fotos"
            accessibilityRole="button">
            <Text style={styles.addPhotosText}>Agregar fotos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs: Textos | Datos */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'textos' && styles.tabActive]}
          onPress={() => setActiveTab('textos')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'textos' }}>
          <Text style={[styles.tabText, activeTab === 'textos' && styles.tabTextActive]}>
            Textos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'datos' && styles.tabActive]}
          onPress={() => setActiveTab('datos')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'datos' }}>
          <Text style={[styles.tabText, activeTab === 'datos' && styles.tabTextActive]}>
            Datos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentInner}>
        {renderBookPreview()}
        {!isCoverPage ? (
          <LayoutSelector
            currentDesign={currentDesign}
            onSelectDesign={handleSelectDesign}
          />
        ) : null}
        {isCoverPage || activeTab === 'textos' ? (
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={currentPageData?.text.content || ''}
              onChangeText={updatePageText}
              placeholder="Texto de prueba"
              placeholderTextColor={colors.text.tertiary}
              multiline
              accessibilityLabel={
                isCoverPage ? 'Texto de la portada' : 'Texto de la página'
              }
            />
          </View>
        ) : (
          <>
            {currentPageData?.text.content ? (
              <View style={styles.pageTextDisplay}>
                <Text style={styles.pageTextContent}>
                  {currentPageData.text.content}
                </Text>
              </View>
            ) : null}
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={styles.outlineChip}
                onPress={() => {
                  const fecha = new Date().toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                  const current = currentPageData?.text.content || '';
                  updatePageText(current ? `${current}\n${fecha}` : fecha);
                }}>
                <View style={styles.chipIcon} />
                <Text style={styles.chipText}>Fecha</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.outlineChip}
                onPress={openLocationInput}
                disabled={showLocationInput}>
                <View style={styles.chipIcon} />
                <Text style={styles.chipText}>Ubicación</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showLocationInput}
        transparent
        animationType="slide"
        onRequestClose={closeLocationInput}>
        <TouchableWithoutFeedback onPress={closeLocationInput}>
          <View style={styles.locationModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.locationModalSheet}>
                <Text style={styles.locationModalTitle}>Agregar ubicación</Text>
                <View style={styles.locationInputRow}>
                  <TextInput
                    style={styles.locationInput}
                    value={locationText}
                    onChangeText={setLocationText}
                    placeholder="Escribe una ubicación..."
                    placeholderTextColor={colors.text.tertiary}
                    accessibilityLabel="Ubicación"
                  />
                  <TouchableOpacity
                    style={styles.locationAutoBtn}
                    onPress={() => fetchCurrentLocation()}>
                    <Image
                      source={icons.search}
                      style={{ width: 16, height: 16, tintColor: colors.text.inverse }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
                {isLoadingLocation && (
                  <Text style={styles.locationHint}>Obteniendo ubicación...</Text>
                )}
                <View style={styles.locationActions}>
                  <TouchableOpacity
                    style={styles.locationCancelBtn}
                    onPress={closeLocationInput}>
                    <Text style={styles.locationCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.locationConfirmBtn}
                    onPress={confirmLocation}
                    disabled={!locationText.trim() || isLoadingLocation}>
                    <Text style={styles.locationConfirmText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Page navigation */}
      <View style={styles.pageNav}>
        <TouchableOpacity
          onPress={goToPrevPage}
          disabled={currentPage === 0}
          style={styles.navArrow}
          accessibilityLabel="Página anterior"
          accessibilityRole="button">
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor: currentPage === 0 ? colors.text.tertiary : colors.text.primary,
              transform: [{ rotate: '180deg' }],
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>
          {`${currentPage} de ${Math.max(pages.length - 1, 0)}`}
        </Text>
        <TouchableOpacity
          onPress={goToNextPage}
          disabled={currentPage === pages.length - 1}
          style={styles.navArrow}
          accessibilityLabel="Página siguiente"
          accessibilityRole="button">
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor:
                currentPage === pages.length - 1
                  ? colors.text.tertiary
                  : colors.text.primary,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Llevarlo conmigo · $300"
          onPress={onBuy}
          icon="badge"
          style={styles.buyButton}
        />
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => {
            void handleSave();
          }}
          disabled={isSaving}>
          <Text style={styles.saveBtnText}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>

      <PhotoActionSheet
        visible={showPhotoActions && selectedPhotoIndex !== null && !isCoverPage}
        photoIndex={selectedPhotoIndex ?? 0}
        canMoveLeft={(selectedPhotoIndex ?? 0) > 0}
        canMoveRight={
          selectedPhotoIndex !== null &&
          (currentPageData?.photos.length ?? 0) > selectedPhotoIndex + 1
        }
        onReplace={handleOpenReplace}
        onApplyFilter={handleOpenFilter}
        onMoveLeft={() => movePhotoOnPage('left')}
        onMoveRight={() => movePhotoOnPage('right')}
        onDelete={() => {
          if (selectedPhotoIndex === null || isDeletingPhoto) return;
          void removePhotoFromPage(selectedPhotoIndex);
        }}
        onClose={closePhotoActions}
      />

      <FilterPickerModal
        visible={
          showFilterPicker &&
          selectedPhotoIndex !== null &&
          Boolean(currentPageData?.photos[selectedPhotoIndex])
        }
        photoUri={currentPageData?.photos[selectedPhotoIndex ?? 0]?.uri ?? ''}
        currentFilter={
          currentPageData?.photos[selectedPhotoIndex ?? 0]?.filter ?? 'none'
        }
        onSelectFilter={applyFilterToPhoto}
        onClose={() => {
          setShowFilterPicker(false);
          setSelectedPhotoIndex(null);
        }}
      />

      <ReplacePhotoPicker
        visible={showReplacePicker && selectedPhotoIndex !== null}
        title="Reemplazar foto"
        confirmLabel="Usar"
        maxSelect={1}
        onClose={() => {
          setShowReplacePicker(false);
          setSelectedPhotoIndex(null);
        }}
        onSelect={replacePhotoOnPage}
      />

      <ReplacePhotoPicker
        visible={showFillEmptyPicker && fillEmptyPageIndex !== null}
        title="Agregar fotos"
        confirmLabel="Agregar"
        maxSelect={
          fillEmptyPageIndex !== null
            ? countAvailablePhotoSlots(pages, fillEmptyPageIndex)
            : 1
        }
        permissionMessage="Necesitamos acceso a tu galería para agregar fotos."
        onClose={() => {
          setShowFillEmptyPicker(false);
          setFillEmptyPageIndex(null);
        }}
        onSelect={fillEmptyPageWithPhotos}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing['4xl'],
  },
  // Header
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  // Title
  titleContainer: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  titleInput: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.text.primary,
    paddingBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  meta: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  addPhotosChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate.medium,
  },
  addPhotosText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing['2xl'],
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.tertiary,
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  // Content
  contentScroll: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  outlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  chipIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.text.tertiary,
  },
  chipText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  // Page text display
  pageTextDisplay: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  pageTextContent: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * 1.5,
  },
  // Location modal
  locationModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  locationModalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  locationModalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  locationInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationInput: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  locationAutoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.slate.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationHint: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  locationCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  locationCancelText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  locationConfirmBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.slate.medium,
    borderRadius: borderRadius.full,
  },
  locationConfirmText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  // Text input (Textos tab)
  textInputContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  textInput: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
  },
  // Page nav
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.lg,
  },
  navArrow: {
    padding: spacing.sm,
  },
  pageIndicator: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  // Bottom actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  buyButton: {
    flex: 1,
  },
  saveBtn: {
    height: 52,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.slate.medium,
  },
  saveBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
});
