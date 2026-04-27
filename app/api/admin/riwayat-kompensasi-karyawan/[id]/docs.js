/**
 * @swagger
 * /api/admin/riwayat-kompensasi-karyawan/{id}:
 *   get:
 *     summary: Detail riwayat kompensasi karyawan
 *     description: Mengambil detail satu riwayat kompensasi karyawan berdasarkan ID.
 *     tags: [Admin - Riwayat Kompensasi Karyawan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID riwayat kompensasi karyawan.
 *     responses:
 *       '200':
 *         description: Detail riwayat kompensasi ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/RiwayatKompensasiKaryawan'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui riwayat kompensasi karyawan
 *     description: Memperbarui data riwayat kompensasi karyawan. Jika periode atau user berubah, sistem akan memvalidasi agar tidak bertabrakan dengan riwayat lain milik user yang sama.
 *     tags: [Admin - Riwayat Kompensasi Karyawan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID riwayat kompensasi karyawan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_user:
 *                 type: string
 *                 description: ID user baru. User harus aktif.
 *               gaji_pokok:
 *                 type: string
 *                 example: '5000000.00'
 *               tunjangan_jabatan:
 *                 type: string
 *                 example: '750000.00'
 *               tunjangan_bpjsk:
 *                 type: string
 *                 example: '200000.00'
 *               tunjangan_kesehatan:
 *                 type: string
 *                 example: '300000.00'
 *               berlaku_mulai:
 *                 type: string
 *                 format: date
 *               berlaku_sampai:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Riwayat kompensasi berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/RiwayatKompensasiKaryawan'
 *       '400':
 *         description: Payload tidak valid atau periode bertabrakan.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Riwayat kompensasi atau user tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus riwayat kompensasi karyawan
 *     description: Melakukan soft delete secara default, atau hard delete jika query param `hard=1` atau `force=1` dikirim.
 *     tags: [Admin - Riwayat Kompensasi Karyawan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID riwayat kompensasi karyawan.
 *       - in: query
 *         name: hard
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Set 1 untuk menghapus permanen (hard delete).
 *       - in: query
 *         name: force
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Alias untuk hard delete.
 *     responses:
 *       '200':
 *         description: Riwayat kompensasi berhasil dihapus.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Data sudah dihapus sebelumnya atau hard delete gagal karena masih direferensikan data lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 */

const adminRiwayatKompensasiKaryawanIdDocs = {};

export default adminRiwayatKompensasiKaryawanIdDocs;
