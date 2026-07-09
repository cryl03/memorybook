import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Dimensions,
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
import { removePhoto } from '@core/store/slices/albumSlice';
import { deleteRemotePhoto } from '@core/api';
import { getErrorMessage } from '@core/api/errors';
import { PhotoActionSheet } from './components/PhotoActionSheet';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import { PageData, LayoutType, PagePhoto } from './types';
import { reverseGeocode } from './geocoding';
import { distributePhotosToPages } from './utils';
import { saveAlbumPages, loadAlbumPages, saveAlbumTitle, loadAlbumTitle } from './storage';

const { width } = Dimensions.get('window');
const PHOTO_GAP = spacing.sm;
const EMPTY_PHOTOS: string[] = [];

interface EditorScreenProps {
  albumTitle: string;
  photoCount: number;
  pageCount: number;
  onSave: () => void;
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
  const [activeTab, setActiveTab] = useState<EditorTab>('datos');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const locationRequestRef = useRef(0);
  const photosCountRef = useRef(photos.length);

  // Initialize pages once: load from storage or distribute from photos
  useEffect(() => {
    if (pagesInitializedRef.current) return;

    const initPages = async () => {
      const savedPages = await loadAlbumPages();
      const savedTitle = await loadAlbumTitle();

      if (savedPages && savedPages.length > 0) {
        setPages(savedPages);
        if (savedTitle) setTitle(savedTitle);
        pagesInitializedRef.current = true;
        return;
      }

      if (photos.length === 0) return;

      const coverPage: PageData = {
        id: 'page-cover',
        photos: [],
        layout: 'single' as LayoutType,
        text: { content: '', fontSize: 14, alignment: 'center' as const },
        stickers: [],
      };

      const distributed = distributePhotosToPages(photos, pageCount);
      setPages([coverPage, ...distributed]);
      pagesInitializedRef.current = true;
    };

    initPages();
  }, [photos, pageCount]);

  useEffect(() => {
    if (!pagesInitializedRef.current) return;
    if (photos.length <= photosCountRef.current) {
      photosCountRef.current = photos.length;
      return;
    }

    const reloadPages = async () => {
      const savedPages = await loadAlbumPages();
      if (savedPages && savedPages.length > 0) {
        setPages(savedPages);
      }
      photosCountRef.current = photos.length;
    };

    reloadPages();
  }, [photos.length]);

  const isCoverPage = currentPage === 0;
  const currentPageData = pages[currentPage];

  // Auto-save pages when they change
  useEffect(() => {
    if (pages.length > 0) {
      saveAlbumPages(pages);
    }
  }, [pages]);

  // Auto-save title when it changes
  useEffect(() => {
    if (title) {
      saveAlbumTitle(title);
    }
  }, [title]);

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

  // Navigation
  const goToPrevPage = () => setCurrentPage(Math.max(0, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(pages.length - 1, currentPage + 1));

  const closePhotoActions = useCallback(() => {
    setShowPhotoActions(false);
    setSelectedPhotoIndex(null);
  }, []);

  const openPhotoActions = useCallback((photoIndex: number) => {
    setSelectedPhotoIndex(photoIndex);
    setShowPhotoActions(true);
  }, []);

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
          prev.map((page, pageIndex) =>
            pageIndex === currentPage
              ? {
                  ...page,
                  photos: page.photos
                    .filter((_, index) => index !== photoIndex)
                    .map((photo, order) => ({ ...photo, order })),
                }
              : page,
          ),
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
    [album.currentAlbum?.remoteFotos, closePhotoActions, currentPage, dispatch, pages],
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

  const renderTouchablePhoto = (
    photo: PagePhoto,
    photoIndex: number,
    containerStyle?: object,
  ) => (
    <TouchableOpacity
      key={`${photo.uri}-${photoIndex}`}
      style={containerStyle}
      onPress={() => openPhotoActions(photoIndex)}
      activeOpacity={0.85}
      accessibilityLabel={`Foto ${photoIndex + 1}. Toca para opciones.`}
      accessibilityRole="button">
      <Image source={{ uri: photo.uri }} style={styles.photoImage} resizeMode="cover" />
    </TouchableOpacity>
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

  // Render ALL photos for the current page in a collage layout
  const renderPagePhotos = () => {
    if (!currentPageData || currentPageData.photos.length === 0) {
      return (
        <View style={styles.emptyPage}>
          <Text style={styles.emptyPageText}>Sin fotos en esta página</Text>
        </View>
      );
    }

    const pagePhotos = currentPageData.photos;
    const count = pagePhotos.length;

    // 1 photo: full width
    if (count === 1) {
      return (
        <View style={styles.photosContainer}>
          <View style={styles.singlePhotoWrapper}>
            {renderTouchablePhoto(pagePhotos[0], 0, styles.singlePhotoTouchable)}
          </View>
        </View>
      );
    }

    // 2 photos: side by side
    if (count === 2) {
      return (
        <View style={styles.photosContainer}>
          <View style={styles.row}>
            {pagePhotos.map((photo, i) =>
              renderTouchablePhoto(photo, i, styles.halfPhoto),
            )}
          </View>
        </View>
      );
    }

    // 3 photos: 1 big left + 2 small right (like Figma)
    if (count === 3) {
      return (
        <View style={styles.photosContainer}>
          <View style={styles.collageRow}>
            {renderTouchablePhoto(pagePhotos[0], 0, styles.collageBig)}
            <View style={styles.collageRightCol}>
              {renderTouchablePhoto(pagePhotos[1], 1, styles.collageSmallTop)}
              {renderTouchablePhoto(pagePhotos[2], 2, styles.collageSmallBottom)}
            </View>
          </View>
        </View>
      );
    }

    // 4+ photos: 2x2 grid (show all in rows of 2)
    const rows: PagePhoto[][] = [];
    for (let i = 0; i < pagePhotos.length; i += 2) {
      rows.push(pagePhotos.slice(i, i + 2));
    }

    return (
      <View style={styles.photosContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((photo, i) => {
              const photoIndex = rowIndex * 2 + i;
              return renderTouchablePhoto(photo, photoIndex, styles.halfPhoto);
            })}
          </View>
        ))}
      </View>
    );
  };

  // Render the book cover for textos tab showing current page photo + text
  const renderBookPreview = () => {
    const coverPhoto = currentPageData?.photos[0]?.uri || photos[0] || null;
    const pageTextContent = currentPageData?.text.content || '';

    return (
      <View style={styles.bookContainer}>
        <View style={styles.bookCover}>
          {/* Photo on cover */}
          <View style={styles.bookPhotoFrame}>
            {coverPhoto ? (
              <Image
                source={{ uri: coverPhoto }}
                style={styles.bookPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bookPhotoPlaceholder} />
            )}
          </View>
          {/* Text area on the book showing what user types */}
          <View style={styles.bookTextArea}>
            {pageTextContent ? (
              <Text style={styles.bookTextContent} numberOfLines={3}>
                {pageTextContent}
              </Text>
            ) : (
              <View style={styles.bookTextBorder} />
            )}
          </View>
        </View>
      </View>
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
            {photoCount} fotos · {pageCount} páginas
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
        {isCoverPage ? (
          <>
            {/* Page 0: Cover — book preview + text input */}
            {renderBookPreview()}
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={currentPageData?.text.content || ''}
                onChangeText={updatePageText}
                placeholder="Texto de prueba"
                placeholderTextColor={colors.text.tertiary}
                multiline
                accessibilityLabel="Texto de la portada"
              />
            </View>
          </>
        ) : activeTab === 'textos' ? (
          <>
            {/* Pages 1+, Textos tab: photos + text input */}
            {renderPagePhotos()}
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={currentPageData?.text.content || ''}
                onChangeText={updatePageText}
                placeholder="Texto de prueba"
                placeholderTextColor={colors.text.tertiary}
                multiline
                accessibilityLabel="Texto de la página"
              />
            </View>
          </>
        ) : (
          <>
            {/* Pages 1+, Datos tab: photos + text + Fecha/Ubicación chips */}
            {renderPagePhotos()}
            {/* Show page text if any */}
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
          {currentPage} de {pages.length - 1}
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
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveBtnText}>Guardar</Text>
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
        onReplace={closePhotoActions}
        onApplyFilter={closePhotoActions}
        onMoveLeft={() => movePhotoOnPage('left')}
        onMoveRight={() => movePhotoOnPage('right')}
        onDelete={() => {
          if (selectedPhotoIndex === null || isDeletingPhoto) return;
          void removePhotoFromPage(selectedPhotoIndex);
        }}
        onClose={closePhotoActions}
      />
    </LinearGradient>
  );
}

const CONTENT_WIDTH = width - spacing['2xl'] * 2;
const PHOTO_SIZE = (CONTENT_WIDTH - PHOTO_GAP) / 2;

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
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  // Photos (Datos tab)
  photosContainer: {
    marginBottom: spacing.xl,
    gap: PHOTO_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: PHOTO_GAP,
  },
  halfPhoto: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  singlePhotoWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  singlePhotoTouchable: {
    width: '100%',
    height: '100%',
  },
  // Collage 3 photos
  collageRow: {
    flexDirection: 'row',
    gap: PHOTO_GAP,
    height: CONTENT_WIDTH * 0.75,
  },
  collageBig: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  collageRightCol: {
    flex: 1,
    gap: PHOTO_GAP,
  },
  collageSmallTop: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  collageSmallBottom: {
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyPage: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  emptyPageText: {
    fontSize: typography.sizes.md,
    color: colors.text.tertiary,
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
  // Book preview (Textos tab)
  bookContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  bookCover: {
    width: width * 0.6,
    height: width * 0.75,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.blue.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  bookPhotoFrame: {
    width: '60%',
    height: '40%',
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
  },
  bookPhoto: {
    width: '100%',
    height: '100%',
  },
  bookPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSecondary,
  },
  bookTextArea: {
    width: '80%',
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTextBorder: {
    width: '100%',
    height: 40,
    borderWidth: 1.5,
    borderColor: colors.blue.medium,
    borderRadius: 4,
  },
  bookTextContent: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Text input (Textos tab)
  textInputContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
