import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';
import { ICacheRepository } from '../repositories/interfaces/ICacheRepository';
import { CacheRepository } from '../repositories/CacheRepository';
import { IDocumentService } from '../services/interfaces/IDocumentService';
import { DocumentService } from '../services/DocumentService';
import { SocketController } from '../controllers/SocketController';

export const container = new Container();

// Bind repositories
container.bind<ICacheRepository>(TYPES.CacheRepository).to(CacheRepository).inSingletonScope();

// Bind services
container.bind<IDocumentService>(TYPES.DocumentService).to(DocumentService).inSingletonScope();

// Bind controllers
container.bind<SocketController>(TYPES.SocketController).to(SocketController).inSingletonScope();