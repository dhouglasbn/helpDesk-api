// src/docs/user.ts
export const userDocs = `
/**
 * @openapi
 * tags:
 *   - name: Users
 *     description: Rotas para gerenciamento de usuários (admins, técnicos e clientes)
 */

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: Autenticação de usuário
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Autenticação bem-sucedida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Credenciais inválidas
 */

/**
 * @openapi
 * /users/tech:
 *   post:
 *     summary: Cria conta de técnico (somente admin)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Técnico criado com sucesso
 *       400:
 *         description: Erro de criação
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 */

/**
 * @openapi
 * /users/techList:
 *   get:
 *     summary: Lista todos os técnicos (somente admin)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de técnicos
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 */

/**
 * @openapi
 * /users/tech/{id}:
 *   put:
 *     summary: Atualiza dados de um técnico
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *                 minLength: 3
 *               newEmail:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Técnico atualizado
 *       400:
 *         description: Erro de atualização
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Técnico não encontrado
 */

/**
 * @openapi
 * /users/techAvailabilities/{id}:
 *   put:
 *     summary: Atualiza horários disponíveis de um técnico
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newAvailabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$"
 *                 description: Horários no formato HH:MM
 *     responses:
 *       200:
 *         description: Horários atualizados
 *       400:
 *         description: Erro de atualização
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 */

/**
 * @openapi
 * /users/admin/{id}:
 *   put:
 *     summary: Atualiza conta de admin
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *                 minLength: 3
 *               newEmail:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Admin atualizado
 *       400:
 *         description: Erro de atualização
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 */

/**
 * @openapi
 * /users/client:
 *   post:
 *     summary: Cria conta de cliente
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Cliente criado
 *       400:
 *         description: Erro de criação
 */

/**
 * @openapi
 * /users/client/{id}:
 *   put:
 *     summary: Atualiza conta de cliente
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *                 minLength: 3
 *               newEmail:
 *                 type: string
 *                 format: email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Cliente atualizado
 *       400:
 *         description: Erro de atualização
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Cliente não encontrado
 */

/**
 * @openapi
 * /users/clientList:
 *   get:
 *     summary: Lista todos os clientes (somente admin)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 */

/**
 * @openapi
 * /users/client/{id}:
 *   delete:
 *     summary: Deleta conta de cliente
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Cliente deletado com sucesso
 *       400:
 *         description: Erro ao deletar cliente
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Cliente não encontrado
 */

/**
 * @openapi
 * /users/picture/{id}:
 *   put:
 *     summary: Atualiza foto de perfil de um usuário
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto atualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessURL:
 *                   type: string
 *       400:
 *         description: Nenhum arquivo enviado ou erro
 *       403:
 *         description: Acesso negado
 *       401:
 *         description: Não autenticado
 */

/**
 * @openapi
 * /users/picture/{id}:
 *   get:
 *     summary: Obtém foto de perfil de um usuário
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Foto do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userPicture:
 *                   type: string
 *                   description: Conteúdo da foto em base64
 *       400:
 *         description: Erro ao buscar foto
 */
`;
