/**
 * @swagger
 * /api/admin/pinjaman-karyawan/{id}:
 *   get:
 *     summary: Detail pinjaman karyawan
 *     description: Mengambil detail satu pinjaman karyawan berdasarkan ID.
 *     tags: [Admin - Pinjaman Karyawan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pinjaman karyawan.
 *     responses:
 *       '200':
 *         description: Detail pinjaman karyawan ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PinjamanKaryawan'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui pinjaman karyawan
 *     description: |
 *       Memperbarui pinjaman karyawan berdasarkan ID. Setelah data disimpan, cicilan akan disinkronkan ulang berdasarkan status akhir pinjaman:
 *       - `AKTIF` akan generate ulang cicilan.
 *       - `DRAFT` dan `DIBATALKAN` akan menghapus seluruh cicilan terkait.
 *     tags: [Admin - Pinjaman Karyawan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pinjaman karyawan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_user:
 *                 type: string
 *               nama_pinjaman:
 *                 type: string
 *                 maxLength: 255
 *               nominal_pinjaman:
 *                 type: string
 *                 example: '10000000.00'
 *               tenor_bulan:
 *                 type: integer
 *                 minimum: 1
 *                 example: 10
 *               sisa_saldo:
 *                 type: string
 *                 example: '7000000.00'
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               status_pinjaman:
 *                 type: string
 *                 enum: [DRAFT, AKTIF, LUNAS, DIBATALKAN]
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Pinjaman karyawan berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PinjamanKaryawan'
 *       '400':
 *         description: Payload tidak valid atau kosong.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus pinjaman karyawan
 *     description: Hanya pinjaman berstatus `DRAFT` atau `DIBATALKAN` yang dapat dihapus. Secara default endpoint melakukan soft delete dan juga menandai seluruh cicilan terkait sebagai soft delete. Tambahkan query `hard=true` atau `force=true` untuk hard delete permanen.
 *     tags: [Admin - Pinjaman Karyawan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID pinjaman karyawan.
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
 *                   $ref: '#/components/schemas/PinjamanKaryawan'
 *                 cascade_summary:
 *                   type: object
 *                   properties:
 *                     cicilan_soft_deleted:
 *                       type: integer
 *                 relation_summary:
 *                   type: object
 *                   properties:
 *                     cicilan_terhapus_mengikuti_cascade:
 *                       type: integer
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Data sudah di-soft delete atau hard delete gagal karena constraint lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 */

const adminPinjamanKaryawanIdDocs = {};

export default adminPinjamanKaryawanIdDocs;
