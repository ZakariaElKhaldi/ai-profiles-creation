import React from 'react';
import { Grid, Typography, Box, CircularProgress } from '@mui/material';
import DocumentCard from './DocumentCard';
import { Document, Dataset } from '../../pages/DocumentsPage';
import { Tag } from './TagManager';
import ErrorBoundary from '../../components/ErrorBoundary';

interface DocumentGridProps {
  documents: Document[];
  datasets: Dataset[];
  tags: Tag[];
  selectedDocId: string | null;
  isLoading: boolean;
  onSelectDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
  onToggleFavorite: (docId: string, isFavorite: boolean) => void;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  datasets,
  tags,
  selectedDocId,
  isLoading,
  onSelectDocument,
  onDeleteDocument,
  onToggleFavorite
}) => {
  // Create a lookup for datasets and tags for efficiency
  const datasetMap = datasets.reduce((acc, dataset) => {
    acc[dataset.id] = dataset.name;
    return acc;
  }, {} as Record<string, string>);

  const tagMap = tags.reduce((acc, tag) => {
    acc[tag.id] = tag;
    return acc;
  }, {} as Record<string, Tag>);

  // Get document tags for display
  const getDocumentTags = (doc: Document) => {
    return doc.tag_ids
      .map(tagId => tagMap[tagId])
      .filter(tag => tag !== undefined);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (documents.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No documents found. Try adjusting your filters or upload a new document.
        </Typography>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc.id}>
            <DocumentCard
              document={doc}
              datasetName={doc.dataset_id ? datasetMap[doc.dataset_id] : ''}
              tags={getDocumentTags(doc)}
              isSelected={selectedDocId === doc.id}
              onClick={() => onSelectDocument(doc.id)}
              onDelete={() => onDeleteDocument(doc.id)}
              onToggleFavorite={() => onToggleFavorite(doc.id, !doc.is_favorite)}
            />
          </Grid>
        ))}
      </Grid>
    </ErrorBoundary>
  );
};

export default DocumentGrid; 