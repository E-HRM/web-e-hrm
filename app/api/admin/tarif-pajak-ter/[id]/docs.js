/**
 * @swagger
 * /api/admin/tarif-pajak-ter/{id}:
 *   get:
 *     summary: Detail tarif pajak TER
 *     description: Mengambil detail satu data tarif pajak TER berdasarkan ID.
 *     tags: [Admin - Tarif Pajak TER]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tarif pajak TER.
 *     responses:
 *       '200':
 *         description: Detail tarif pajak TER ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TarifPajakTER'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui tarif pajak TER
 *     description: Memperbarui data tarif pajak TER. Sistem akan memvalidasi agar kode kategori pajak, periode berlaku, dan rentang penghasilan tidak bentrok dengan data aktif lain.
 *     tags: [Admin - Tarif Pajak TER]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tarif pajak TER.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kode_kategori_pajak:
 *                 type: string
 *                 example: TK_0
 *               penghasilan_dari:
 *                 type: string
 *                 example: '0.00'
 *               penghasilan_sampai:
 *                 type: string
 *                 nullable: true
 *                 example: '5400000.00'
 *               persen_tarif:
 *                 type: string
 *                 example: '0.2500'
 *               berlaku_mulai:
 *                 type: string
 *                 format: date
 *               berlaku_sampai:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Tarif pajak TER berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TarifPajakTER'
 *       '400':
 *         description: Payload tidak valid atau data bentrok.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus tarif pajak TER
 *     description: Secara default melakukan soft delete. Tambahkan query `hard=true` atau `force=true` untuk hard delete permanen.
 *     tags: [Admin - Tarif Pajak TER]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tarif pajak TER.
 *       - in: query
 *         name: hard
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['1', 'true']
 *         description: Isi `true` atau `1` untuk menghapus permanen.
 *       - in: query
 *         name: force
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['1', 'true']
 *         description: Alias untuk hard delete permanen.
 *     responses:
 *       '200':
 *         description: Data berhasil dihapus, baik soft delete maupun hard delete.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mode:
 *                   type: string
 *                   enum: [soft, hard]
 *                 data:
 *                   $ref: '#/components/schemas/TarifPajakTER'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Hard delete gagal karena masih direferensikan data lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 */

const adminTarifPajakTERIdDocs = {};

export default adminTarifPajakTERIdDocs;
