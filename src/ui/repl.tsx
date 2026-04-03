import React, { useState, useEffect } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import { AgentLoop } from '../agent/loop.js';
import { Config } from '../types/index.js';

interface Props {
  agent: AgentLoop;
  config: Config;
}

const REPL: React.FC<Props> = ({ agent, config }) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOutput, setCurrentOutput] = useState('');
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      exit();
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

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">Forge 🔥 v1.0.0</Text>
        <Text color="gray"> - Using model: {config.model}</Text>
      </Box>

      <Box flexDirection="column">
        {history.map((msg, i) => (
          <Box key={i} marginBottom={msg.role === 'user' ? 0 : 1}>
            <Text color={msg.role === 'user' ? 'green' : msg.role === 'error' ? 'red' : 'white'}>
              {msg.role === 'user' ? 'forge> ' : msg.role === 'error' ? 'Error: ' : ''}
              {msg.content}
            </Text>
          </Box>
        ))}
      </Box>

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

      {!isProcessing && (
        <Box>
          <Text color="green">{'forge> '}</Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
          />
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray">Press Esc or Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
};

export const startREPL = (agent: AgentLoop, config: Config) => {
  render(<REPL agent={agent} config={config} />);
};
