/**
 * @swagger
 * /api/admin/payout-konsultan/{id}:
 *   get:
 *     summary: Detail payout konsultan
 *     description: Mengambil detail satu payout konsultan beserta detail transaksi sumbernya.
 *     tags: [Admin - Payout Konsultan]
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
 *         description: Detail payout konsultan ditemukan.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui payout konsultan
 *     description: |
 *       Memperbarui payout konsultan berdasarkan ID dengan aturan bisnis berikut:
 *       - payout yang sudah `DIPOSTING_KE_PAYROLL` tidak bisa diubah lagi.
 *       - perubahan `id_periode_konsultan` atau `id_user` akan memicu sinkronisasi ulang detail transaksi sumber.
 *       - `total_share`, `nominal_dibayarkan`, `disetujui_pada`, dan `diposting_pada` dihitung otomatis oleh sistem.
 *       - jika status diubah menjadi `DIPOSTING_KE_PAYROLL`, sistem akan membuat/memperbarui item komponen payroll dan menandai transaksi sumber sebagai sudah diposting.
 *     tags: [Admin - Payout Konsultan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_periode_konsultan:
 *                 type: string
 *               id_user:
 *                 type: string
 *               id_periode_payroll:
 *                 type: string
 *                 nullable: true
 *               nominal_ditahan:
 *                 type: string
 *                 example: '0.00'
 *               nominal_penyesuaian:
 *                 type: string
 *                 example: '-50000.00'
 *               status_payout:
 *                 type: string
 *                 enum: [DRAFT, DISETUJUI, DIPOSTING_KE_PAYROLL, DITAHAN]
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Payout konsultan berhasil diperbarui.
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Konflik bisnis atau kombinasi data duplikat.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus payout konsultan
 *     description: |
 *       Soft delete secara default. Gunakan query `?hard=true` untuk hard delete.
 *       Payout yang sudah diposting ke payroll tidak dapat dihapus.
 *     tags: [Admin - Payout Konsultan]
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
 *           default: 0
 *     responses:
 *       '200':
 *         description: Payout konsultan berhasil dihapus.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Data tidak dapat dihapus karena konflik bisnis.
 *       '500':
 *         description: Terjadi kesalahan server.
 */
