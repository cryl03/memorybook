import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { icons } from '@core/assets/icons';
import { PageData } from '../types';
import { FilteredImage } from './FilteredImage';

const { width } = Dimensions.get('window');
const BOOK_WIDTH = width * 0.7;
const BOOK_HEIGHT = BOOK_WIDTH * 1.35;

interface BookPreviewProps {
  pages: PageData[];
  albumTitle: string;
  visible: boolean;
  onClose: () => void;
  onGoToPage: (pageIndex: number) => void;
}

export function BookPreview({
  pages,
  albumTitle,
  visible,
  onClose,
  onGoToPage,
}: BookPreviewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  if (!visible) return null;

  const handleScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / (BOOK_WIDTH + spacing.lg));
    setCurrentPage(page);
  };

  const renderPagePreview = (page: PageData, index: number) => {
    const hasPhotos = page.photos.length > 0;

    return (
      <TouchableOpacity
        key={page.id}
        style={styles.page}
        onPress={() => {
          onGoToPage(index);
          onClose();
        }}
        activeOpacity={0.9}
        accessibilityLabel={`Página ${index + 1}. Toca para editar.`}
        accessibilityRole="button">
        <View style={styles.pageContent}>
          {hasPhotos ? (
            <View style={styles.pagePhotos}>
              {page.photos.slice(0, 4).map((photo, pIndex) => (
                <View
                  key={`${photo.uri}-${pIndex}`}
                  style={[
                    styles.previewPhoto,
                    page.photos.length === 1 && styles.previewPhotoFull,
                    page.photos.length === 2 && styles.previewPhotoHalf,
                  ]}>
                  <FilteredImage
                    uri={photo.uri}
                    filter={photo.filter}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPage}>
              <Text style={styles.emptyPageText}>Página vacía</Text>
            </View>
          )}

          {page.text.content ? (
            <View style={styles.textPreview}>
              <Text
                style={[styles.textPreviewContent, { textAlign: page.text.alignment }]}
                numberOfLines={2}>
                {page.text.content}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.pageNumber}>{index + 1}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vista previa</Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityLabel="Cerrar vista previa"
          accessibilityRole="button">
          <Image
            source={icons['arrow-right']}
            style={{ width: 18, height: 18, tintColor: colors.text.primary, transform: [{ rotate: '180deg' }] }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.albumTitle}>{albumTitle}</Text>
      <Text style={styles.pageCount}>
        {pages.length} páginas - Desliza para explorar
      </Text>

      {/* Book scroll */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={BOOK_WIDTH + spacing.lg}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={handleScroll}>
        {pages.map((page, index) => renderPagePreview(page, index))}
      </ScrollView>

      {/* Page indicator */}
      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>
          {currentPage + 1} de {pages.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  closeBtn: {
    padding: spacing.sm,
  },
  albumTitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    paddingHorizontal: spacing.xl,
  },
  pageCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  page: {
    width: BOOK_WIDTH,
    height: BOOK_HEIGHT,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pageContent: {
    flex: 1,
    padding: spacing.sm,
  },
  pagePhotos: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  previewPhoto: {
    flex: 1,
    minWidth: '45%',
    minHeight: '45%',
    borderRadius: borderRadius.sm / 2,
    overflow: 'hidden',
  },
  previewPhotoFull: {
    minWidth: '100%',
    minHeight: '100%',
  },
  previewPhotoHalf: {
    minWidth: '48%',
    minHeight: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.sm,
  },
  emptyPageText: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  textPreview: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  textPreviewContent: {
    fontSize: 9,
    color: colors.text.secondary,
  },
  pageNumber: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontWeight: typography.weights.medium,
  },
  indicator: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  indicatorText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
