import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Dataset } from '../../pages/DocumentsPage';
import { Tag } from './TagManager';

interface DocumentFiltersProps {
  datasets: Dataset[];
  tags: Tag[];
  selectedDatasetId: string | null;
  selectedTagIds: string[];
  showFavorites: boolean;
  onSelectDataset: (datasetId: string | null) => void;
  onSelectTags: (tagIds: string[]) => void;
  onToggleFavorites: (show: boolean) => void;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  datasets,
  tags,
  selectedDatasetId,
  selectedTagIds,
  showFavorites,
  onSelectDataset,
  onSelectTags,
  onToggleFavorites,
}) => {
  // Handle dataset change
  const handleDatasetChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onSelectDataset(value === 'all' ? null : value);
  };

  // Handle tags change
  const handleTagChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onSelectTags(typeof value === 'string' ? [value] : value);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        mb: 3, 
        p: 2, 
        borderRadius: 1, 
        bgcolor: '#1e2838',
        border: theme => `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          color: '#99a1b0',
          fontWeight: 600,
          fontSize: '1rem'
        }}
      >
        Filters
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'flex-start' }}>
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel 
            id="dataset-select-label" 
            size="small"
            sx={{ 
              color: '#99a1b0',
              '&.Mui-focused': {
                color: 'primary.main'
              }
            }}
          >
            Dataset
          </InputLabel>
          <Select
            labelId="dataset-select-label"
            value={selectedDatasetId || 'all'}
            onChange={handleDatasetChange}
            size="small"
            label="Dataset"
            sx={{
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'action.hover',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
              '.MuiSelect-select': {
                color: '#99a1b0',
              }
            }}
          >
            <MenuItem value="all">All Datasets</MenuItem>
            {datasets.map((dataset) => (
              <MenuItem key={dataset.id} value={dataset.id}>
                {dataset.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel 
            id="tags-select-label" 
            size="small"
            sx={{ 
              color: '#99a1b0',
              '&.Mui-focused': {
                color: 'primary.main'
              }
            }}
          >
            Tags
          </InputLabel>
          <Select
            labelId="tags-select-label"
            multiple
            value={selectedTagIds}
            onChange={handleTagChange}
            input={<OutlinedInput label="Tags" size="small" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((tagId) => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <Chip 
                      key={tagId} 
                      label={tag.name} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${tag.color}20`, 
                        color: tag.color,
                        borderColor: `${tag.color}40`,
                        '.MuiChip-deleteIcon': {
                          color: `${tag.color}80`,
                          '&:hover': {
                            color: tag.color
                          }
                        }
                      }}
                    />
                  ) : null;
                })}
              </Box>
            )}
            sx={{
              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'action.hover',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
              '.MuiSelect-select': {
                color: '#99a1b0',
              }
            }}
          >
            {tags.map((tag) => (
              <MenuItem key={tag.id} value={tag.id}>
                <Checkbox 
                  checked={selectedTagIds.indexOf(tag.id) > -1} 
                  sx={{ 
                    color: `${tag.color}80`,
                    '&.Mui-checked': {
                      color: tag.color,
                    }
                  }}
                />
                <ListItemText 
                  primary={tag.name} 
                  sx={{ 
                    '.MuiTypography-root': { 
                      color: '#99a1b0',
                      display: 'flex',
                      alignItems: 'center',
                      '&::before': {
                        content: '""',
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: tag.color,
                        marginRight: '8px'
                      }
                    } 
                  }}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', alignItems: 'center', pt: { xs: 0, sm: 1 } }}>
          <FormControlLabel
            control={
              <Switch 
                checked={showFavorites} 
                onChange={(e) => onToggleFavorites(e.target.checked)}
                size="small"
                sx={{
                  '.MuiSwitch-switchBase': {
                    color: 'action.active',
                    '&.Mui-checked': {
                      color: 'primary.main',
                      '& + .MuiSwitch-track': {
                        backgroundColor: 'primary.main',
                        opacity: 0.5
                      }
                    }
                  },
                  '.MuiSwitch-track': {
                    backgroundColor: 'action.disabledBackground'
                  }
                }}
              />
            }
            label={
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: '0.875rem',
                  color: '#99a1b0'
                }}
              >
                Favorites only
              </Typography>
            }
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default DocumentFilters; 