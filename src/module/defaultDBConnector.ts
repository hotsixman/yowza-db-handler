import dotenv from 'dotenv';
import { DBConnectorOption } from '../types';
import { DBConnector } from './DBConnector';

dotenv.config();

const option: DBConnectorOption = {
    host: process.env.DB_HOST ?? '',
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASSWORD ?? '',
    port: process.env.DB_PORT ?? ''
};

export const defaultDBConnector = new DBConnector(option);