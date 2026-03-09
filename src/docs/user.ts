/**
 * @openapi
 * /users/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Realiza login e retorna o token JWT
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
 *                 example: tecnico1@tech.com
 *               password:
 *                 type: string
 *                 example: hashed-password
 *     responses:
 *       200:
 *         description: Login realizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Credenciais inválidas
 */

/**
 * @openapi
 * /users/tech:
 *   post:
 *     tags:
 *       - Users
 *     summary: Cria conta de técnico (ADMIN)
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
 *               - phone
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Técnico 4
 *               email:
 *                 type: string
 *                 format: email
 *                 example: tecnico4@tech.com
 *               password:
 *                 type: string
 *                 example: hashed-password
 *               phone:
 *                 type: string
 *                 example: "11999999999"
 *               address:
 *                 type: string
 *                 example: Rua Exemplo, 123
 *     responses:
 *       201:
 *         description: Técnico criado
 *       403:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /users/techList:
 *   get:
 *     tags:
 *       - Users
 *     summary: Lista contas de técnicos (ADMIN)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de técnicos
 */

/**
 * @openapi
 * /users/tech/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Atualiza conta de técnico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: a290e17b-d0a3-4b36-b3dd-75a3e810be7b
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newName
 *               - newEmail
 *               - newPassword
 *               - newPhone
 *               - newAddress
 *             properties:
 *               newName:
 *                 type: string
 *                 example: Técnico 33
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 example: tecnico3@tech.com
 *               newPassword:
 *                 type: string
 *                 example: hashed-password
 *               newPhone:
 *                 type: string
 *                 example: "22999999999"
 *               newAddress:
 *                 type: string
 *                 example: Rua Exemplo, 321
 *     responses:
 *       200:
 *         description: Técnico atualizado
 *       403:
 *         description: Não autorizado
 */

/**
 * @openapi
 * /users/techAvailabilities/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Atualiza horários disponíveis do técnico
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: a290e17b-d0a3-4b36-b3dd-75a3e810be7b
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAvailabilities
 *             properties:
 *               newAvailabilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["14:00", "15:00"]
 *     responses:
 *       200:
 *         description: Horários atualizados
 */

/**
 * @openapi
 * /users/admin/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Atualiza um administrador
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 8dfceb80-199c-488f-8918-a0609175399c
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newName
 *               - newEmail
 *               - newPassword
 *               - newPhone
 *               - newAddress
 *             properties:
 *               newName:
 *                 type: string
 *                 example: Administrador Postman
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 example: administrador@admin.com
 *               newPassword:
 *                 type: string
 *                 example: hashed-password
 *               newPhone:
 *                 type: string
 *                 example: "22999999999"
 *               newAddress:
 *                 type: string
 *                 example: Rua Exemplo, 321
 *     responses:
 *       200:
 *         description: Admin atualizado
 */

/**
 * @openapi
 * /users/client:
 *   post:
 *     tags:
 *       - Users
 *     summary: Cria conta de cliente
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
 *               - phone
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Cliente Postman
 *               email:
 *                 type: string
 *                 format: email
 *                 example: cliente@postman.com
 *               password:
 *                 type: string
 *                 example: hashed-password
 *               phone:
 *                 type: string
 *                 example: "11999999999"
 *               address:
 *                 type: string
 *                 example: Rua Exemplo, 123
 *     responses:
 *       201:
 *         description: Cliente criado
 */

/**
 * @openapi
 * /users/client/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Atualiza conta de cliente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *             required:
 *               - newName
 *               - newEmail
 *               - newPassword
 *               - newPhone
 *               - newAddress
 *             properties:
 *               newName:
 *                 type: string
 *                 example: Cliente Postman Atualizado
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 example: cliente@postman.com
 *               newPassword:
 *                 type: string
 *                 example: hashed-password
 *               newPhone:
 *                 type: string
 *                 example: "22999999999"
 *               newAddress:
 *                 type: string
 *                 example: Rua Exemplo, 321
 *     responses:
 *       200:
 *         description: Cliente atualizado
 */

/**
 * @openapi
 * /users/client/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Deleta conta de cliente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Conta removida
 */

/**
 * @openapi
 * /users/picture/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Atualiza a foto de um usuário
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *             required:
 *               - profilePic
 *             properties:
 *               profilePic:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Foto atualizada
 */

/**
 * @openapi
 * /users/picture/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Retorna a foto do usuário
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Foto retornada
 */