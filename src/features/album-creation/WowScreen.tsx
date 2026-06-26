import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { useAppSelector } from '@core/store/hooks';

const { width } = Dimensions.get('window');

interface WowScreenProps {
  albumTitle: string;
  photoCount: number;
  pageCount: number;
  hasRemoteAlbum?: boolean;
  onEdit: () => void;
  onBuy: () => void;
  onSave: () => void | Promise<void>;
  onGeneratePdf?: () => void | Promise<void>;
}

export function WowScreen({
  albumTitle,
  photoCount,
  pageCount,
  hasRemoteAlbum = false,
  onEdit,
  onBuy,
  onSave,
  onGeneratePdf,
}: WowScreenProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const album = useAppSelector(state => state.album);
  const photos = album.currentAlbum?.photos || [];

  const goToPrev = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNext = () => setCurrentPage(Math.min(pageCount, currentPage + 1));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (!onGeneratePdf) return;
    setIsGeneratingPdf(true);
    try {
      await onGeneratePdf();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Get the photo for the current page preview
  const photosPerPage = Math.ceil(photos.length / pageCount);
  const pageStartIndex = (currentPage - 1) * photosPerPage;
  const currentPagePhoto = photos[pageStartIndex] || photos[0] || null;

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F5F0EB']}
      style={styles.container}>
      {/* Album book preview */}
      <View style={styles.bookWrapper}>
        <View style={styles.bookCover}>
          {/* Photo on cover - changes per page */}
          <View style={styles.bookPhotoFrame}>
            {currentPagePhoto ? (
              <Image
                source={{ uri: currentPagePhoto }}
                style={styles.bookPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bookPhotoPlaceholder} />
            )}
          </View>
          {/* Cursive text on cover */}
          <View style={styles.bookTextLines}>
            <View style={styles.textLine} />
            <View style={[styles.textLine, { width: '70%' }]} />
            <View style={[styles.textLine, { width: '50%' }]} />
          </View>
        </View>
      </View>

      {/* Album info */}
      <Text style={styles.albumTitle}>{albumTitle}</Text>
      <Text style={styles.albumMeta}>
        {photoCount} fotos · {pageCount} páginas
      </Text>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Page navigation */}
      <View style={styles.pageNav}>
        <TouchableOpacity
          onPress={goToPrev}
          disabled={currentPage === 1}
          style={styles.navArrow}
          accessibilityLabel="Página anterior"
          accessibilityRole="button">
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor: currentPage === 1 ? colors.text.tertiary : colors.text.primary,
              transform: [{ rotate: '180deg' }],
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>{currentPage} de {pageCount}</Text>
        <TouchableOpacity
          onPress={goToNext}
          disabled={currentPage === pageCount}
          style={styles.navArrow}
          accessibilityLabel="Página siguiente"
          accessibilityRole="button">
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor: currentPage === pageCount ? colors.text.tertiary : colors.text.primary,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.buyButton} onPress={onBuy}>
          <Text style={styles.buyButtonText}>Llevarlo conmigo · $300</Text>
          <Image
            source={icons.badge}
            style={{ width: 18, height: 18, tintColor: colors.text.inverse }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}>
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>

      {hasRemoteAlbum && onGeneratePdf ? (
        <TouchableOpacity
          onPress={handleGeneratePdf}
          style={styles.pdfLink}
          disabled={isGeneratingPdf}>
          <Text style={styles.pdfLinkText}>
            {isGeneratingPdf ? 'Generando PDF...' : 'Generar PDF'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Edit link */}
      <TouchableOpacity onPress={onEdit} style={styles.editLink}>
        <Text style={styles.editLinkText}>Editar</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing['5xl'],
  },
  // Book
  bookWrapper: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  bookCover: {
    width: width * 0.55,
    height: width * 0.78,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.blue.light,
    alignItems: 'center',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  bookPhotoFrame: {
    width: '55%',
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
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
  bookTextLines: {
    width: '80%',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  textLine: {
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 1,
  },
  // Info
  albumTitle: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  albumMeta: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  spacer: {
    flex: 1,
  },
  // Page nav
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing.xl,
  },
  navArrow: {
    padding: spacing.sm,
  },
  pageIndicator: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  // Bottom
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.slate.medium,
    gap: spacing.sm,
  },
  buyButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  saveButton: {
    height: 52,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.slate.medium,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  editLink: {
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
  },
  editLinkText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
  pdfLink: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pdfLinkText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
