import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import { icons } from '@core/assets/icons';
import { colors, typography, spacing, borderRadius } from '@core/theme';
import { Button } from '@shared/components';

const { width } = Dimensions.get('window');

interface EditorScreenProps {
  albumTitle: string;
  photoCount: number;
  pageCount: number;
  onSave: () => void;
  onBuy: () => void;
  onBack: () => void;
}

type Tab = 'textos' | 'fotos';

export function EditorScreen({
  albumTitle,
  photoCount,
  pageCount,
  onSave,
  onBuy,
  onBack,
}: EditorScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('fotos');
  const [currentPage, setCurrentPage] = useState(0);
  const [title, setTitle] = useState(albumTitle);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const renderPhotosTab = () => (
    <View style={styles.tabContent}>
      {/* Photo grid for current page */}
      <View style={styles.photoGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <TouchableOpacity key={i} style={styles.pagePhoto}>
            <View style={styles.photoPlaceholder} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTextosTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.textEditorContainer}>
        <TextInput
          style={styles.textEditor}
          multiline
          placeholder="Texto de prueba"
          placeholderTextColor={colors.text.tertiary}
        />
        <View style={styles.textActions}>
          <TouchableOpacity style={styles.textChip}>
            <Text style={styles.textChipLabel}>Fecha</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.textChip}>
            <Text style={styles.textChipLabel}>Ubicación</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBack}>Editando</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        {isEditingTitle ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            onBlur={() => setIsEditingTitle(false)}
            autoFocus
          />
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditingTitle(true)}
            style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <Image
              source={icons.new}
              style={{ width: 16, height: 16, tintColor: colors.text.secondary }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {photoCount} fotos · {pageCount} páginas
          </Text>
          <TouchableOpacity style={styles.addPhotosButton}>
            <Text style={styles.addPhotosText}>Agregar fotos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'textos' && styles.tabActive]}
          onPress={() => setActiveTab('textos')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'textos' && styles.tabTextActive,
            ]}>
            Textos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fotos' && styles.tabActive]}
          onPress={() => setActiveTab('fotos')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'fotos' && styles.tabTextActive,
            ]}>
            Fotos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'fotos' ? renderPhotosTab() : renderTextosTab()}
      </ScrollView>

      <View style={styles.pageNav}>
        <TouchableOpacity
          onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}>
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
          {currentPage + 1} de {pageCount}
        </Text>
        <TouchableOpacity
          onPress={() => setCurrentPage(Math.min(pageCount - 1, currentPage + 1))}
          disabled={currentPage === pageCount - 1}>
          <Image
            source={icons['arrow-right']}
            style={{
              width: 20,
              height: 20,
              tintColor: currentPage === pageCount - 1 ? colors.text.tertiary : colors.text.primary,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Llévalo contigo · $300"
          onPress={onBuy}
          icon="badge"
          style={styles.buyButton}
        />
        <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
          <Text style={styles.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerBack: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  titleContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  titleInput: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.text.primary,
    paddingBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  meta: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  addPhotosButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.peach,
  },
  addPhotosText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginRight: spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.text.primary,
  },
  tabText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  contentScroll: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.xl,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pagePhoto: {
    width: (width - spacing.xl * 2 - spacing.sm) / 2,
    aspectRatio: 1,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceSecondary,
  },
  textEditorContainer: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 120,
  },
  textEditor: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    minHeight: 60,
  },
  textActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  textChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.peach,
  },
  textChipLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  pageIndicator: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  buyButton: {
    flex: 2,
  },
  saveBtn: {
    flex: 1,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceSecondary,
  },
  saveBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
});
