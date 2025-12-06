// src/docs/service.ts
export const serviceDocs = `
/**
 * @openapi
 * tags:
 *   - name: Services
 *     description: Rotas para gerenciamento de serviços
 */

/**
 * @openapi
 * /services:
 *   post:
 *     summary: Cria um novo serviço
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título do serviço
 *                 minLength: 3
 *               price:
 *                 type: number
 *                 description: Preço do serviço
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Serviço criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 price:
 *                   type: number
 *                 active:
 *                   type: boolean
 *       400:
 *         description: Erro de validação ou criação
 *       403:
 *         description: Acesso negado (somente admin)
 *       401:
 *         description: Não autenticado
 */

/**
 * @openapi
 * /services/{id}:
 *   put:
 *     summary: Atualiza um serviço existente
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do serviço a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *               price:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Serviço atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 price:
 *                   type: number
 *                 active:
 *                   type: boolean
 *       400:
 *         description: Erro de validação ou atualização
 *       403:
 *         description: Acesso negado (somente admin)
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Serviço não encontrado
 */

/**
 * @openapi
 * /services/{id}:
 *   delete:
 *     summary: Desativa (soft delete) um serviço
 *     tags:
 *       - Services
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do serviço a ser desativado
 *     responses:
 *       204:
 *         description: Serviço desativado com sucesso (sem conteúdo)
 *       400:
 *         description: Erro ao tentar desativar serviço
 *       403:
 *         description: Acesso negado (somente admin)
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Serviço não encontrado
 */
`;
