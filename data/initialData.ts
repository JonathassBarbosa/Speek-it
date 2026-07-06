import { Sala, User } from '../types';

// NOTE: In a real application, passwords would be managed by an authentication service (e.g., Firebase Auth, Auth0).
// This is a mock password store for demonstration purposes ONLY.
export const MOCK_PASSWORDS: { [email: string]: string } = {
    'dev@app.com': 'admin',
    'sup@app.com': 'sup',
    'user@app.com': 'user',
};

export const SALAS: Sala[] = [
    'PRAIA DE PIPA', 'PORTO DE GALLINHAS', 'CUPE', 'MURO ALTO', 'PORTO ALTO HOTEL', 
    'FORTALEZA ORLA', 'JOÃO PESSOA', 'SALINAS MATRIZ', 'SALINAS BEACH', 'JERI BEACH CLUB', 
    'GUNGA', 'MARAGOGI', 'MARAGOGI BEACH', 'MACEIÓ ORLA', 'PRAIA DO FRANCÊS', 'BELÉM', 
    'GRAMADO HORTÊNCIAS', 'PIRENÓPOLIS', 'GRAMADO LUGUITO', 'CUIABÁ', 
    'JERICOACOARA', 'GRAMADO MATRIZ', 'GRAMADO CASA LUGANO', 'TREINAMENTO'
];

export const INITIAL_USERS: User[] = [
    {
        id: 'dev-01',
        name: 'Dev Admin',
        email: 'dev@app.com',
        // password: 'admin', // REMOVED
        role: 'dev',
        sala: 'TREINAMENTO',
    },
    {
        id: 'sup-01',
        name: 'Supervisor Pipa',
        email: 'sup@app.com',
        // password: 'sup', // REMOVED
        role: 'supervisor',
        sala: 'PRAIA DE PIPA',
    },
    {
        id: 'user-01',
        name: 'Jonathas Pipa',
        email: 'user@app.com',
        // password: 'user', // REMOVED
        role: 'user',
        sala: 'PRAIA DE PIPA',
    },
];