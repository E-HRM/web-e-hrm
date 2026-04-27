/**
 * @swagger
 * /api/admin/produk-konsultan/{id}:
 *   get:
 *     summary: Detail jenis produk konsultan
 *     description: Mengambil detail satu jenis produk konsultan berdasarkan ID.
 *     tags: [Admin - Jenis Produk Konsultan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID jenis produk konsultan.
 *     responses:
 *       '200':
 *         description: Detail jenis produk konsultan ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/JenisProdukKonsultan'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui jenis produk konsultan
 *     description: Memperbarui jenis produk konsultan berdasarkan ID.
 *     tags: [Admin - Jenis Produk Konsultan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID jenis produk konsultan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_produk:
 *                 type: string
 *                 maxLength: 255
 *               persen_share_default:
 *                 type: string
 *                 nullable: true
 *                 example: '10.0000'
 *                 description: Nilai persentase default share, rentang 0 sampai 100.
 *               aktif:
 *                 type: boolean
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Jenis produk konsultan berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/JenisProdukKonsultan'
 *       '400':
 *         description: Payload tidak valid atau kosong.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Nama produk sudah digunakan oleh data lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus jenis produk konsultan
 *     description: Secara default melakukan soft delete. Tambahkan query `hard=true` atau `force=true` untuk hard delete permanen.
 *     tags: [Admin - Jenis Produk Konsultan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID jenis produk konsultan.
 *       - in: query
 *         name: hard
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['1', 'true']
 *         description: Isi `true` atau `1` untuk hard delete permanen.
 *       - in: query
 *         name: force
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['1', 'true']
 *         description: Alias dari hard delete permanen.
 *     responses:
 *       '200':
 *         description: Data berhasil dihapus.
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
 *                   $ref: '#/components/schemas/JenisProdukKonsultan'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Data sudah di-soft delete atau hard delete gagal karena masih direferensikan data lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 */

const adminJenisProdukKonsultanIdDocs = {};

export default adminJenisProdukKonsultanIdDocs;
