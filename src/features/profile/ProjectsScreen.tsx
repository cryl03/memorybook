import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@core/theme';

interface ProjectsScreenProps {
  onBack: () => void;
  onEdit: (projectId: string) => void;
}

interface Project {
  id: string;
  title: string;
  lastEdited: string;
}

const MOCK_PROJECTS: Project[] = [
  { id: '1', title: 'Verano en la playa', lastEdited: 'hace 3 horas' },
  { id: '2', title: 'Verano en la playa', lastEdited: 'hace 6 días' },
  { id: '3', title: 'Verano en la playa', lastEdited: 'hace 6 días' },
];

export function ProjectsScreen({ onBack, onEdit }: ProjectsScreenProps) {
  const recentProjects = MOCK_PROJECTS.slice(0, 1);
  const otherProjects = MOCK_PROJECTS.slice(1);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Tus proyectos{'\n'}guardados</Text>

      {recentProjects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Editado recientemente</Text>
          {recentProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[styles.projectCard, styles.projectCardRecent]}
              onPress={() => onEdit(project.id)}>
              <View style={styles.projectThumb} />
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectDate}>{project.lastEdited}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {otherProjects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Otros proyectos</Text>
          {otherProjects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => onEdit(project.id)}>
              <View style={styles.projectThumb} />
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectDate}>{project.lastEdited}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
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
    marginBottom: spacing['2xl'],
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
});
