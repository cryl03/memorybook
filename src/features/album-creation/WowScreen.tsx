import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { useAppSelector } from '@core/store/hooks';
import { AlbumPdfPreview } from './AlbumPdfPreview';

const { width } = Dimensions.get('window');

interface WowScreenProps {
  albumTitle: string;
  onEdit: () => void;
  onBuy: () => void;
  onSave: () => void | Promise<void>;
  onAddPhotos: () => void;
}

export function WowScreen({
  albumTitle,
  onEdit,
  onBuy,
  onSave,
  onAddPhotos,
}: WowScreenProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const album = useAppSelector(state => state.album);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const photos = album.currentAlbum?.photos || [];
  const coverPhoto = photos[0] || null;
  const remoteId = album.currentAlbum?.remoteId;
  const pdfRevision = album.currentAlbum?.pdfUrl;
  const [pdfPage, setPdfPage] = React.useState(1);
  const [pdfPageCount, setPdfPageCount] = React.useState(0);
  const showPdf = Boolean(isAuthenticated && remoteId);

  React.useEffect(() => {
    setPdfPage(1);
    setPdfPageCount(0);
  }, [remoteId]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FAF7F2', '#FAF7F2']}
      style={styles.container}>
      {/* Closed cover only — no glow circle */}
      <View style={styles.bookWrapper}>
        <View style={[styles.bookCover, showPdf ? styles.bookCoverPdf : null]}>
          {showPdf && remoteId ? (
            <View style={styles.pdfSlot}>
              <AlbumPdfPreview
                albumId={remoteId}
                page={pdfPage}
                revision={pdfRevision}
                onDocumentLoad={total => {
                  setPdfPageCount(total);
                }}
              />
            </View>
          ) : (
            <>
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
              <View style={styles.bookTextLines}>
                <View style={styles.textLine} />
                <View style={[styles.textLine, { width: '70%' }]} />
                <View style={[styles.textLine, { width: '50%' }]} />
              </View>
            </>
          )}
        </View>
      </View>

      <Text style={styles.albumTitle}>{albumTitle}</Text>
      <View style={styles.metaRow}>
        {showPdf && pdfPageCount > 0 ? (
          <Text style={styles.albumMeta}>{pdfPageCount} páginas</Text>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={styles.addPhotosChip}
          onPress={onAddPhotos}
          accessibilityLabel="Agregar fotos"
          accessibilityRole="button">
          <Text style={styles.addPhotosText}>Agregar fotos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />

      {/* Páginas del PDF del backend — no del editor local */}
      <View style={styles.pageNav}>
        <TouchableOpacity
          disabled={!showPdf || pdfPage <= 1}
          onPress={() => setPdfPage(p => Math.max(1, p - 1))}
          style={styles.navArrow}
          accessibilityLabel="Página anterior">
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor:
                showPdf && pdfPage > 1
                  ? colors.text.primary
                  : colors.text.tertiary,
              transform: [{ rotate: '180deg' }],
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>
          {showPdf
            ? pdfPageCount > 0
              ? `${pdfPage} / ${pdfPageCount}`
              : 'Álbum'
            : 'Portada'}
        </Text>
        <TouchableOpacity
          disabled={!showPdf || pdfPageCount === 0 || pdfPage >= pdfPageCount}
          onPress={() => setPdfPage(p => Math.min(pdfPageCount, p + 1))}
          style={styles.navArrow}
          accessibilityLabel="Página siguiente"
          accessibilityRole="button">
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor:
                showPdf && pdfPageCount > 0 && pdfPage < pdfPageCount
                  ? colors.text.primary
                  : colors.text.tertiary,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.buyButton} onPress={onBuy}>
          <Text style={styles.buyButtonText}>Llevarlo conmigo - $300</Text>
          <Image
            source={icons.badge}
            style={styles.buyButtonIcon}
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
    paddingTop: spacing['4xl'],
  },
  bookWrapper: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  bookCover: {
    width: width * 0.78,
    height: width * 1.05,
    borderRadius: borderRadius.sm,
    backgroundColor: '#A8C4D9',
    alignItems: 'center',
    paddingTop: spacing['4xl'],
    paddingHorizontal: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  bookCoverPdf: {
    paddingTop: 0,
    paddingHorizontal: 0,
    backgroundColor: colors.surface,
  },
  pdfSlot: {
    width: '100%',
    flex: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
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
  albumTitle: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  albumMeta: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  addPhotosChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#635C57',
  },
  addPhotosText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.inverse,
  },
  spacer: {
    flex: 1,
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing['3xl'],
    marginBottom: spacing['2xl'],
  },
  navArrow: {
    padding: spacing.sm,
    width: 40,
    alignItems: 'center',
  },
  pageIndicator: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontWeight: typography.weights.regular,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing['3xl'],
    gap: spacing.md,
    marginBottom: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.button.primary,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buyButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  buyButtonIcon: {
    width: 18,
    height: 18,
    tintColor: colors.text.inverse,
  },
  saveButton: {
    height: 52,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: '#635C57',
    minWidth: 110,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  editLink: {
    alignItems: 'center',
    paddingBottom: spacing['4xl'],
  },
  editLinkText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textDecorationLine: 'underline',
  },
});
