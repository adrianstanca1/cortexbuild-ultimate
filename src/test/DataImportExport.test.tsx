import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseFile } from '../components/ui/DataImportExport';

describe('exportData', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalConsoleError = console.error;

  beforeEach(() => {
    URL.createObjectURL = vi.fn((_blob: Blob) => 'blob:test') as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    console.error = originalConsoleError;
  });

  it('handles empty data gracefully', async () => {
    const { exportData } = await import('../components/ui/DataImportExport');
    
    exportData({ filename: 'test', format: 'csv', data: [] });
    
    expect(console.error).toHaveBeenCalledWith('No data to export');
  });

  it('exports data to CSV format', async () => {
    const { exportData } = await import('../components/ui/DataImportExport');
    const data = [
      { id: 1, name: 'Project A', status: 'active' },
      { id: 2, name: 'Project B', status: 'completed' },
    ];
    
    exportData({ filename: 'test', format: 'csv', data });
    
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('exports data to JSON format', async () => {
    const { exportData } = await import('../components/ui/DataImportExport');
    const data = [
      { id: 1, name: 'Project A' },
      { id: 2, name: 'Project B' },
    ];
    
    exportData({ filename: 'test', format: 'json', data });
    
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});

describe('parseFile', () => {
  describe('CSV parsing', () => {
    it('parses basic CSV content', () => {
      const content = 'id,name,status\n1,Project A,active\n2,Project B,completed';
      const result = parseFile(content, 'csv');
      
      expect(result.headers).toEqual(['id', 'name', 'status']);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(['1', 'Project A', 'active']);
    });

    it('handles empty lines', () => {
      const content = 'id,name\n1,Test\n\n2,Test2\n';
      const result = parseFile(content, 'csv');
      
      expect(result.headers).toEqual(['id', 'name']);
      expect(result.data).toHaveLength(2);
    });

    it('handles CSV with quoted values containing commas', () => {
      const content = 'id,description\n1,"Has, comma"\n2,Normal';
      const result = parseFile(content, 'csv');
      
      expect(result.data[0]).toEqual(['1', 'Has, comma']);
    });

    it('handles CSV with empty cells', () => {
      const content = 'id,name,value\n1,Test,\n2,,100';
      const result = parseFile(content, 'csv');
      
      expect(result.data[0]).toEqual(['1', 'Test', '']);
      expect(result.data[1]).toEqual(['2', '', '100']);
    });
  });

  describe('JSON parsing', () => {
    it('parses JSON array', () => {
      const content = JSON.stringify([
        { id: 1, name: 'Project A' },
        { id: 2, name: 'Project B' },
      ]);
      const result = parseFile(content, 'json');
      
      expect(result.rawData).toHaveLength(2);
      expect(result.headers).toContain('id');
      expect(result.headers).toContain('name');
    });

    it('throws on invalid JSON', () => {
      expect(() => parseFile('not valid json', 'json')).toThrow('Invalid JSON format');
    });

    it('handles JSON with nested objects', () => {
      const content = JSON.stringify([
        { id: 1, user: { name: 'John', email: 'john@test.com' } },
      ]);
      const result = parseFile(content, 'json');
      
      expect(result.rawData[0].user).toEqual({ name: 'John', email: 'john@test.com' });
    });
  });
});
