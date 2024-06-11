// UI interface for selecting a model from a list of models
// This component is used in the ModelSelectionModal component
// It is a dropdown list of models that the user can select from
// The user can also search for a specific model by typing in the search bar
// The user can also filter the models by type
// The user can select a model from the dropdown list
// the panel controlling the model selection can be hidden or shown
// Once selected, the model is either loaded from the local storage or downloaded
// the remix ai desktop plugin provided the interface for storing the model in the local storage after downloading


import React, { useState, useEffect } from 'react';
import { Select, Input, Button, Icon } from 'antd';
import { Model } from '@remix/remix-ai-core';
import { getModels } from '../services';
import { ModelType } from '@remix/remix-ai-core';
import { useTranslation } from 'react-i18next';

const { Option } = Select;
const { Search } = Input;

interface ModelSelectionProps {
  onSelect: (model: Model) => void;
}

export const ModelSelection: React.FC<ModelSelectionProps> = ({ onSelect }) => {
  const { t } = useTranslation();
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [search, setSearch] = useState<string>('');
  const [type, setType] = useState<ModelType | 'all'>('all');

  useEffect(() => {
    getModels().then(setModels);
  }, []);

  useEffect(() => {
    setFilteredModels(models.filter((model) => {
      return model.name.toLowerCase().includes(search.toLowerCase()) &&
        (type === 'all' || model.type === type);
    }));
  }, [models, search, type]);

  return (
    <div>
      <Search
        placeholder={t('search_models')}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 200, marginBottom: 10 }}
      />
      <Select
        defaultValue="all"
        style={{ width: 200, marginBottom: 10 }}
        onChange={(value) => setType(value)}
      >
        <Option value="all">{t('all_models')}</Option>
        <Option value={ModelType.IMAGE}>{t('image_models')}</Option>
        <Option value={ModelType.TEXT}>{t('text_models')}</Option>
        <Option value={ModelType.AUDIO}>{t('audio_models')}</Option>
      </Select>
      <Select
        showSearch
        style={{ width: 200 }}
        placeholder={t('select_model')}
        optionFilterProp="children"
        onChange={(value) => onSelect(models.find((model) => model.name === value))}
        filterOption={(input, option) =>
          option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
        }
      >
        {filteredModels.map((model) => (
          <Option key={model.name} value={model.name}>
            {model.name}
          </Option>
        ))}
      </Select>
    </div>
  );
};