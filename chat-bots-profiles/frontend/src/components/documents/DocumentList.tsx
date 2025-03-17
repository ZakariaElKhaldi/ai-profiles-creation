import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  IconButton,
  Chip,
  Box,
  CircularProgress,
  Tooltip,
  Divider,
  ListItemButton
} from '@mui/material';
import { Delete, Star, StarBorder, Description } from '@mui/icons-material';
import { Document } from '../../pages/DocumentsPage';
import ErrorBoundary from '../ErrorBoundary';

interface DocumentListProps {
  documents: Document[];
  selectedDocId: string | null;
  isLoading: boolean;
  onSelectDocument: (docId: string) => void;
  onDeleteDocument: (docId: string) => void;
  onGenerateEmbedding?: (docId: string) => void;
  onToggleFavorite: (docId: string, isFavorite: boolean) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocId,
  isLoading,
  onSelectDocument,
  onDeleteDocument,
  onGenerateEmbedding,
  onToggleFavorite
}) => {
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <ErrorBoundary>
      <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
        {documents.map((doc, index) => (
          <React.Fragment key={doc.id}>
            {index > 0 && <Divider component="li" />}
            <ListItemButton
              alignItems="flex-start"
              selected={selectedDocId === doc.id}
              onClick={() => onSelectDocument(doc.id)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': { backgroundColor: '#f5f5f5' },
                transition: 'background-color 0.2s'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mr: 2 }}>
                <Description 
                  sx={{ 
                    color: 'primary.main', 
                    opacity: 0.7, 
                    mt: 0.5 
                  }} 
                />
              </Box>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" component="span">
                      {doc.title}
                    </Typography>
                    {doc.embedding_status === 'completed' && (
                      <Chip 
                        label="Embedded" 
                        size="small" 
                        color="success"
                        sx={{ fontSize: '0.7rem', height: '20px' }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'block', mb: 1 }}
                    >
                      {truncateText(doc.content, 120)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.8rem' }}>
                      <Typography variant="caption" color="text.secondary">
                        {doc.dataset_name || 'No dataset'}
                      </Typography>
                      <span>•</span>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(doc.created_at)}
                      </Typography>
                      {doc.metadata?.page_count && (
                        <>
                          <span>•</span>
                          <Typography variant="caption" color="text.secondary">
                            {doc.metadata.page_count} pages
                          </Typography>
                        </>
                      )}
                    </Box>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Tooltip title={doc.is_favorite ? "Remove from favorites" : "Add to favorites"}>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(doc.id, !doc.is_favorite);
                    }}
                    color={doc.is_favorite ? "warning" : "default"}
                    size="small"
                  >
                    {doc.is_favorite ? <Star /> : <StarBorder />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete document">
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this document?')) {
                        onDeleteDocument(doc.id);
                      }
                    }}
                    color="error"
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItemButton>
          </React.Fragment>
        ))}
      </List>
    </ErrorBoundary>
  );
};

export default DocumentList; 