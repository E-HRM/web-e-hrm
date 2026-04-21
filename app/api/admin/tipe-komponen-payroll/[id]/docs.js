/**
 * @swagger
 * /api/admin/tipe-komponen-payroll/{id}:
 *   get:
 *     summary: Detail tipe komponen payroll
 *     description: Mengambil detail satu tipe komponen payroll berdasarkan ID.
 *     tags: [Admin - Tipe Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tipe komponen payroll.
 *     responses:
 *       '200':
 *         description: Detail tipe komponen payroll ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TipeKomponenPayroll'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui tipe komponen payroll
 *     description: Memperbarui tipe komponen payroll berdasarkan ID.
 *     tags: [Admin - Tipe Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tipe komponen payroll.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nama_tipe_komponen:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       '200':
 *         description: Tipe komponen payroll berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TipeKomponenPayroll'
 *       '400':
 *         description: Payload tidak valid atau kosong.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Nama tipe komponen sudah digunakan oleh data lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus tipe komponen payroll
 *     description: Secara default melakukan soft delete. Tambahkan query `hard=true` atau `force=true` untuk hard delete permanen.
 *     tags: [Admin - Tipe Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tipe komponen payroll.
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
 *                   $ref: '#/components/schemas/TipeKomponenPayroll'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Data sudah di-soft delete atau hard delete gagal karena masih direferensikan definisi komponen payroll.
 *       '500':
 *         description: Terjadi kesalahan server.
 */

const adminTipeKomponenPayrollIdDocs = {};

export default adminTipeKomponenPayrollIdDocs;
