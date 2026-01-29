
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { JulesClient } from '../src/jules-client';

vi.mock('axios');

describe('JulesClient', () => {
    let client: JulesClient;
    const mockApiKey = 'test-api-key';
    const mockedAxios = axios as any;

    beforeEach(() => {
        vi.resetAllMocks();
        mockedAxios.create = vi.fn(() => mockedAxios);
        mockedAxios.request = vi.fn();
        mockedAxios.isAxiosError = vi.fn((err) => !!err.isAxiosError);
        client = new JulesClient(mockApiKey);
    });

    it('should create a session', async () => {
        const mockResponse = {
            data: {
                id: 'sess-123',
                name: 'sessions/sess-123',
                state: 'QUEUED'
            }
        };
        mockedAxios.request.mockResolvedValueOnce(mockResponse);

        const result = await client.createSession({ prompt: 'test task' });
        
        expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
            method: 'POST',
            url: '/sessions',
            data: { prompt: 'test task' }
        }));
        expect(result).toEqual(mockResponse.data);
    });

    it('should list sessions', async () => {
        const mockResponse = {
            data: {
                sessions: [{ id: '1' }]
            }
        };
        mockedAxios.request.mockResolvedValueOnce(mockResponse);

        await client.listSessions(10);
        
        expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
            method: 'GET',
            url: '/sessions',
            params: { pageSize: 10, pageToken: undefined }
        }));
    });

    it('should send a message', async () => {
        mockedAxios.request.mockResolvedValueOnce({ data: {} });
        
        await client.sendMessage('sessions/123', 'hello');
        
        expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
            method: 'POST',
            url: '/sessions/123:sendMessage',
            data: { prompt: 'hello' }
        }));
    });

    it('should handle API errors', async () => {
        const error = new Error('API Error');
        (error as any).isAxiosError = true;
        (error as any).response = { data: { error: { message: 'Bad Request' } } };
        mockedAxios.request.mockRejectedValueOnce(error);

        await expect(client.createSession({ prompt: '' })).rejects.toThrow(/Bad Request/);
    });
});
