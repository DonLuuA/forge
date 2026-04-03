import React, { useState, useEffect } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import { AgentLoop } from '../agent/loop.js';
import { Config } from '../types/index.js';

interface Props {
  agent: AgentLoop;
  config: Config;
  onModelChange: (model: string) => void;
}

const REPL: React.FC<Props> = ({ agent, config, onModelChange }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOutput, setCurrentOutput] = useState('');
  const [isSelectingModel, setIsSelectingModel] = useState(false);
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      exit();
    }
    if (key.ctrl && input === 'm') {
      setIsSelectingModel(!isSelectingModel);
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    
    setInput('');
    setHistory(prev => [...prev, { role: 'user', content: value }]);
    setIsProcessing(true);
    setCurrentOutput('');

    try {
      await agent.run(value, (update) => {
        setCurrentOutput(prev => prev + update);
      });
    } catch (error: any) {
      setHistory(prev => [...prev, { role: 'error', content: error.message }]);
    } finally {
      setIsProcessing(false);
      setHistory(prev => [...prev, { role: 'assistant', content: currentOutput }]);
      setCurrentOutput('');
    }
  };

  const handleModelSelect = (item: { label: string; value: string }) => {
    onModelChange(item.value);
    setIsSelectingModel(false);
  };

  const modelOptions = config.providers?.flatMap(p => 
    p.models.map(m => ({ label: `${p.name}: ${m}`, value: m }))
  ) || [];

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header Section */}
      <Box borderStyle="round" borderColor="cyan" paddingX={2} marginBottom={1} flexDirection="column">
        <Text bold color="cyan">
          FORGE CLI v1.1.0 🔥
        </Text>
        <Box>
          <Text color="gray">Model: </Text>
          <Text color="yellow" bold>{config.model}</Text>
          <Text color="gray"> | </Text>
          <Text color="blue">Ctrl+M to change model</Text>
        </Box>
      </Box>

      {/* History Section */}
      <Box flexDirection="column" marginBottom={1}>
        {history.map((msg, i) => (
          <Box key={i} marginBottom={msg.role === 'user' ? 0 : 1}>
            <Text color={msg.role === 'user' ? 'green' : msg.role === 'error' ? 'red' : 'white'}>
              {msg.role === 'user' ? 'forge> ' : msg.role === 'error' ? 'Error: ' : ''}
              {msg.content}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Model Selection Dropdown */}
      {isSelectingModel && (
        <Box borderStyle="single" borderColor="yellow" padding={1} marginBottom={1} flexDirection="column">
          <Text bold color="yellow">Select Model:</Text>
          <SelectInput items={modelOptions} onSelect={handleModelSelect} />
        </Box>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Box marginBottom={1}>
          <Text color="yellow">
            <Spinner type="dots" /> Processing...
          </Text>
          <Box marginLeft={1}>
            <Text color="gray">{currentOutput}</Text>
          </Box>
        </Box>
      )}

      {/* Input Section */}
      {!isProcessing && !isSelectingModel && (
        <Box>
          <Text color="green" bold>{'forge> '}</Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
          />
        </Box>
      )}

      {/* Footer Section */}
      <Box marginTop={1}>
        <Text color="gray">Press Esc or Ctrl+C to exit | Ctrl+M to switch models</Text>
      </Box>
    </Box>
  );
};

export const startREPL = (agent: AgentLoop, config: Config, onModelChange: (model: string) => void) => {
  render(<REPL agent={agent} config={config} onModelChange={onModelChange} />);
};
