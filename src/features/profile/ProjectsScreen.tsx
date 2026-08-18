import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { albumService } from '@core/api';
import type { Album } from '@core/api/types';
import { getErrorMessage } from '@core/api/errors';
import { ALLOW_GUEST_FLOW } from '@core/api';
import { useAppSelector } from '@core/store/hooks';
import {
  getLocalAlbumSummary,
  LOCAL_ALBUM_ID,
  type LocalAlbumSummary,
} from '@core/storage/localAlbum';

interface ProjectsScreenProps {
  onBack: () => void;
  onEdit: (projectId: string, album?: Album) => Promise<void>;
  onCreateNew: () => void;
}

function formatRelativeDate(dateString?: string): string {
  if (!dateString) return 'Sin fecha';

  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'hace unos minutos';
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getCoverUri(album: Album): string | null {
  const firstPhoto = album.fotos?.[0];
  return firstPhoto?.imagen ?? null;
}

export function ProjectsScreen({ onBack, onEdit, onCreateNew }: ProjectsScreenProps) {
  const auth = useAppSelector(state => state.auth);
  const currentAlbum = useAppSelector(state => state.album.currentAlbum);
  const localAlbum = useMemo(() => getLocalAlbumSummary(currentAlbum), [currentAlbum]);

  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!auth.isAuthenticated) {
      setAlbums([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await albumService.listAlbums();
      setAlbums(response.results ?? []);
      setError(null);
    } catch (err) {
      setAlbums([]);
      setError(getErrorMessage(err, 'No se pudieron cargar los proyectos'));
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects]),
  );

  const handleOpenProject = useCallback(
    async (projectId: string, album?: Album) => {
      setOpeningId(projectId);
      setError(null);
      try {
        await onEdit(projectId, album);
      } catch (err) {
        Alert.alert(
          'No se pudo abrir',
          getErrorMessage(err, 'No se pudo abrir el proyecto'),
        );
      } finally {
        setOpeningId(null);
      }
    },
    [onEdit],
  );

  const handleDeleteProject = useCallback(
    (project: Album) => {
      if (!project.unique_id) return;

      Alert.alert(
        'Eliminar álbum',
        `¿Eliminar "${project.nombre}"? Esta acción no se puede deshacer.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              setDeletingId(project.unique_id!);
              try {
                await albumService.deleteAlbum(project.unique_id!);
                setAlbums(current =>
                  current.filter(item => item.unique_id !== project.unique_id),
                );
              } catch (err) {
                setError(getErrorMessage(err, 'No se pudo eliminar el álbum'));
              } finally {
                setDeletingId(null);
              }
            },
          },
        ],
      );
    },
    [],
  );

  const recentProjects = useMemo(() => albums.slice(0, 1), [albums]);
  const otherProjects = useMemo(() => albums.slice(1), [albums]);
  const showGuestProjects =
    ALLOW_GUEST_FLOW && !auth.isAuthenticated && Boolean(localAlbum);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Tus proyectos{'\n'}guardados</Text>

      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreateNew}
        accessibilityRole="button"
        accessibilityLabel="Crear nuevo álbum">
        <Text style={styles.createButtonText}>+ Crear nuevo álbum</Text>
      </TouchableOpacity>

      {showGuestProjects && localAlbum ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>En este dispositivo</Text>
          <LocalProjectCard
            album={localAlbum}
            loading={openingId === LOCAL_ALBUM_ID}
            onPress={() => handleOpenProject(LOCAL_ALBUM_ID)}
          />
          <Text style={styles.guestHint}>
            Inicia sesión para sincronizar este álbum y verlo en otros dispositivos.
          </Text>
        </View>
      ) : null}

      {auth.isAuthenticated ? (
        isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.text.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity onPress={loadProjects}>
              <Text style={styles.retry}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : albums.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.empty}>Aún no tienes proyectos en la nube.</Text>
          </View>
        ) : (
          <>
            {recentProjects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Editado recientemente</Text>
                {recentProjects.map(project => (
                  <ProjectCard
                    key={project.unique_id}
                    album={project}
                    recent
                    loading={openingId === project.unique_id}
                    deleting={deletingId === project.unique_id}
                    onPress={() => handleOpenProject(project.unique_id!, project)}
                    onDelete={() => handleDeleteProject(project)}
                  />
                ))}
              </View>
            )}

            {otherProjects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Otros proyectos</Text>
                {otherProjects.map(project => (
                  <ProjectCard
                    key={project.unique_id}
                    album={project}
                    loading={openingId === project.unique_id}
                    deleting={deletingId === project.unique_id}
                    onPress={() => handleOpenProject(project.unique_id!, project)}
                    onDelete={() => handleDeleteProject(project)}
                  />
                ))}
              </View>
            )}
          </>
        )
      ) : !showGuestProjects ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>
            Crea un álbum y se guardará aquí automáticamente, sin necesidad de cuenta.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function LocalProjectCard({
  album,
  loading,
  onPress,
}: {
  album: LocalAlbumSummary;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.projectCard, styles.projectCardRecent]}
      onPress={onPress}
      disabled={loading}>
      {album.coverUri ? (
        <Image source={{ uri: album.coverUri }} style={styles.projectThumb} />
      ) : (
        <View style={styles.projectThumb} />
      )}
      <View style={styles.projectInfo}>
        <Text style={styles.projectTitle}>{album.title}</Text>
        <Text style={styles.projectDate}>
          {loading ? 'Abriendo...' : `${album.photoCount} fotos · ${album.pageCount} páginas`}
        </Text>
      </View>
      {loading ? <ActivityIndicator color={colors.text.primary} /> : null}
    </TouchableOpacity>
  );
}

interface ProjectCardProps {
  album: Album;
  recent?: boolean;
  loading?: boolean;
  deleting?: boolean;
  onPress: () => void;
  onDelete: () => void;
}

function ProjectCard({
  album,
  recent = false,
  loading = false,
  deleting = false,
  onPress,
  onDelete,
}: ProjectCardProps) {
  const coverUri = getCoverUri(album);

  return (
    <TouchableOpacity
      style={[styles.projectCard, recent && styles.projectCardRecent]}
      onPress={onPress}
      disabled={loading || deleting}>
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={styles.projectThumb} />
      ) : (
        <View style={styles.projectThumb} />
      )}
      <View style={styles.projectInfo}>
        <Text style={styles.projectTitle}>{album.nombre}</Text>
        <Text style={styles.projectDate}>
          {deleting
            ? 'Eliminando...'
            : loading
              ? 'Abriendo...'
              : formatRelativeDate(album.fecha_modificacion ?? album.fecha_creacion)}
        </Text>
      </View>
      {loading || deleting ? (
        <ActivityIndicator color={colors.text.primary} />
      ) : (
        <TouchableOpacity onPress={onDelete} hitSlop={8}>
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  backButton: {
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
    marginBottom: spacing.lg,
  },
  createButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  createButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    fontSize: typography.sizes.md,
  },
  retry: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
  },
  empty: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: typography.sizes.md * 1.5,
  },
  guestHint: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * 1.5,
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  projectCardRecent: {
    backgroundColor: colors.accent.peach,
  },
  projectThumb: {
    width: 40,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.blue.light,
    marginRight: spacing.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  projectDate: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  deleteText: {
    fontSize: typography.sizes.xs,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
});
