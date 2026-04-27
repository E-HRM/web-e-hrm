/**
 * @swagger
 * /api/admin/payout-konsultan-detail/{id}:
 *   get:
 *     summary: Detail payout konsultan detail
 *     description: Mengambil detail satu payout konsultan detail berdasarkan ID.
 *     tags: [Admin - Payout Konsultan Detail]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Detail payout konsultan detail ditemukan.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui payout konsultan detail
 *     description: |
 *       Memperbarui payout konsultan detail berdasarkan ID.
 *       Rule bisnis:
 *       - payout induk tujuan wajib aktif, tidak soft delete, periode tidak terkunci, dan belum `DIPOSTING_KE_PAYROLL`.
 *       - transaksi tujuan wajib berasal dari user dan periode payout yang sama.
 *       - transaksi tujuan tidak boleh sudah diposting ke payroll atau terhubung ke payout aktif lain.
 *       - jika record sedang soft delete, gunakan query `?restore=true` untuk memulihkan sambil memperbarui.
 *       - jika payout induk berubah, ringkasan payout lama dan payout baru dihitung ulang otomatis.
 *     tags: [Admin - Payout Konsultan Detail]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: restore
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Set `1` atau `true` untuk memulihkan record soft delete sambil update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_payout_konsultan:
 *                 type: string
 *               id_transaksi_konsultan:
 *                 type: string
 *               nominal_share:
 *                 type: number
 *                 format: decimal
 *               nominal_oss:
 *                 type: number
 *                 format: decimal
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Payout konsultan detail berhasil diperbarui.
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Konflik relasi bisnis payout atau transaksi.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus payout konsultan detail
 *     description: |
 *       Soft delete secara default. Gunakan query `?hard=true` untuk hapus permanen.
 *       Setelah penghapusan, `total_share` dan `nominal_ditahan` payout induk dihitung ulang otomatis.
 *       `nominal_dibayarkan` payout induk akan mengikuti `nominal_penyesuaian` yang tersimpan.
 *       Detail tidak dapat dihapus bila payout induk sudah `DIPOSTING_KE_PAYROLL` atau periode payout terkunci.
 *     tags: [Admin - Payout Konsultan Detail]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hard
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Set `1` atau `true` untuk hapus permanen.
 *     responses:
 *       '200':
 *         description: Payout konsultan detail berhasil dihapus.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Detail tidak dapat dihapus karena status payout induk.
 *       '500':
 *         description: Terjadi kesalahan server.
 */
export const payoutKonsultanDetailByIdDocs = true;
