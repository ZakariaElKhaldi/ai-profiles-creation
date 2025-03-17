import React from 'react';
import { Card, CardContent, CardActions, Typography, Chip, Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Delete, Star, StarBorder, CheckCircle } from '@mui/icons-material';
import { Document } from '../../pages/DocumentsPage';
import { Tag } from './TagManager';
import { useTheme } from '@mui/material/styles';

interface DocumentCardProps {
  document: Document;
  datasetName: string;
  tags: Tag[];
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  datasetName,
  tags,
  isSelected,
  onClick,
  onDelete,
  onToggleFavorite
}) => {
  const theme = useTheme();

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#1e2838',
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)'
        },
        ...(isSelected ? {
          borderColor: 'primary.main',
          boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
        } : {})
      }}
      onClick={onClick}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            noWrap 
            sx={{ 
              fontSize: '1rem', 
              fontWeight: 600,
              color: '#99a1b0',
              maxWidth: 'calc(100% - 30px)'
            }}
          >
            {document.title || document.file_name || 'Untitled Document'}
          </Typography>
          
          {document.embedding_status === 'completed' && (
            <Tooltip title="Embeddings available">
              <CheckCircle fontSize="small" color="success" />
            </Tooltip>
          )}
          
          {document.embedding_status === 'processing' && (
            <Tooltip title="Processing embeddings">
              <CircularProgress size={16} color="warning" />
            </Tooltip>
          )}
        </Box>
        
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1.5, 
            color: '#99a1b0',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            height: '4.5em',
            lineHeight: '1.5em'
          }}
        >
          {document.content ? truncateText(document.content, 150) : 'No content available'}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#99a1b0',
              fontSize: '0.75rem'
            }}
          >
            {document.dataset_name || 'No dataset'}
          </Typography>
          
          <Box 
            component="span" 
            sx={{ 
              fontSize: '0.75rem', 
              color: '#99a1b0' 
            }}
          >
            •
          </Box>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#99a1b0',
              fontSize: '0.75rem'
            }}
          >
            {formatDate(document.created_at)}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {document.tags && document.tags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              size="small"
              sx={{
                height: '20px',
                fontSize: '0.7rem',
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                borderColor: `${tag.color}40`,
                '& .MuiChip-label': {
                  px: 1
                }
              }}
            />
          ))}
        </Box>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-start', pt: 0 }}>
        <Tooltip title={document.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            sx={{ 
              color: document.is_favorite ? 'warning.main' : 'action.active',
              '&:hover': {
                color: document.is_favorite ? 'warning.dark' : 'warning.light'
              }
            }}
          >
            {document.is_favorite ? <Star /> : <StarBorder />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Delete document">
          <IconButton 
            size="small" 
            color="error" 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this document?')) {
                onDelete();
              }
            }}
            sx={{
              color: 'error.main',
              '&:hover': {
                color: 'error.dark'
              }
            }}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default DocumentCard; 