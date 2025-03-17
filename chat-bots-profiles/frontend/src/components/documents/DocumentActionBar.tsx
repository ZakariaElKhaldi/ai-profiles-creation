import React from 'react';
import { Box, Tabs, Tab, Button, IconButton, Tooltip, Paper, Divider } from '@mui/material';
import { ViewList, ViewModule, Add, Upload, Dataset as DatasetIcon, LocalOffer, Search, FilterList } from '@mui/icons-material';

interface DocumentActionBarProps {
  viewMode: 'list' | 'grid';
  activeTab: string;
  numDocuments: number;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onCreateDocument: () => void;
  onUploadDocument: () => void;
  onSearchChange: (query: string) => void;
  onShowFilters: () => void;
  onSelectDataset: (datasetId: string | null) => void;
  onSelectTags: (tagIds: string[]) => void;
  onTabChange: (tab: string) => void;
  onShowDatasetManager: () => void;
  onShowTagManager: () => void;
}

const DocumentActionBar: React.FC<DocumentActionBarProps> = ({
  viewMode,
  activeTab,
  numDocuments,
  onViewModeChange,
  onCreateDocument,
  onUploadDocument,
  onSearchChange,
  onShowFilters,
  onSelectDataset,
  onSelectTags,
  onTabChange,
  onShowDatasetManager,
  onShowTagManager
}) => {
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    onTabChange(newValue);
    
    // Reset filters based on tab
    if (newValue === 'all') {
      onSelectDataset(null);
      onSelectTags([]);
    } else if (newValue === 'favorites') {
      onSelectDataset(null);
      onSelectTags([]);
    }
  };

  return (
    <Paper elevation={0} sx={{ mb: 2, p: 2, bgcolor: '#1e2838', borderRadius: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => onTabChange(newValue)}
          aria-label="document tabs"
          sx={{
            '& .MuiTab-root': {
              color: '#99a1b0',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            }
          }}
        >
          <Tab value="all" label={`All ${numDocuments > 0 ? `(${numDocuments})` : ''}`} />
          <Tab value="recent" label="Recent" />
          <Tab value="favorites" label="Favorites" />
        </Tabs>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Document filters">
            <IconButton 
              size="small" 
              onClick={onShowFilters}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <FilterList />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Manage datasets">
            <IconButton 
              size="small" 
              onClick={onShowDatasetManager}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <DatasetIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Manage tags">
            <IconButton 
              size="small" 
              onClick={onShowTagManager}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <LocalOffer />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: 'divider' }} />
          
          <Tooltip title="List view">
            <IconButton 
              size="small" 
              onClick={() => onViewModeChange('list')}
              color={viewMode === 'list' ? 'primary' : 'default'}
              sx={{ 
                color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <ViewList />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Grid view">
            <IconButton 
              size="small" 
              onClick={() => onViewModeChange('grid')}
              color={viewMode === 'grid' ? 'primary' : 'default'}
              sx={{ 
                color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <ViewModule />
            </IconButton>
          </Tooltip>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: 'divider' }} />
          
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<Upload />} 
            onClick={onUploadDocument}
            sx={{ 
              borderColor: 'primary.main', 
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'primary.dark',
                color: 'primary.contrastText'
              }
            }}
          >
            Upload
          </Button>
          
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<Add />} 
            onClick={onCreateDocument}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            Create
          </Button>
        </Box>
      </Box>
      
      <Box>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search sx={{ color: 'text.secondary' }} />
          </div>
          <input
            className="bg-[#1e2838] border border-gray-300 dark:border-gray-700 rounded-md py-2 pl-10 pr-4 block w-full text-sm text-[#99a1b0] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search documents..."
            type="text"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </Box>
    </Paper>
  );
};

export default DocumentActionBar; 