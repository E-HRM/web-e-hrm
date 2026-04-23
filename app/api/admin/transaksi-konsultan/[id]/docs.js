/**
 * @swagger
 * /api/admin/transaksi-konsultan/{id}:
 *   get:
 *     summary: Detail transaksi konsultan
 *     description: Mengambil detail satu transaksi konsultan berdasarkan ID.
 *     tags: [Admin - Transaksi Konsultan]
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
 *         description: Detail transaksi konsultan ditemukan.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui transaksi konsultan
 *     description: |
 *       Memperbarui transaksi konsultan berdasarkan ID.
 *       Data tidak bisa diubah jika periode transaksi sudah `TERKUNCI`
 *       atau transaksi sudah diposting ke payroll.
 *       Recalculation `total_income`, `nominal_share`, dan `nominal_oss`
 *       akan dijalankan ulang sesuai payload terbaru.
 *     tags: [Admin - Transaksi Konsultan]
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
 *               id_user_konsultan:
 *                 type: string
 *                 nullable: true
 *               id_jenis_produk_konsultan:
 *                 type: string
 *                 nullable: true
 *               tanggal_transaksi:
 *                 type: string
 *                 format: date
 *               nama_klien:
 *                 type: string
 *                 nullable: true
 *               deskripsi:
 *                 type: string
 *                 nullable: true
 *               nominal_debit:
 *                 type: number
 *                 format: decimal
 *               nominal_kredit:
 *                 type: number
 *                 format: decimal
 *               persen_share_default:
 *                 type: number
 *                 format: decimal
 *                 nullable: true
 *               persen_share_override:
 *                 type: number
 *                 format: decimal
 *                 nullable: true
 *               override_manual:
 *                 type: boolean
 *               nominal_share:
 *                 type: number
 *                 format: decimal
 *                 description: Dipakai saat `override_manual=true`; bila `override_manual=false`, server mengabaikan field ini.
 *               nominal_oss:
 *                 type: number
 *                 format: decimal
 *                 description: Dipakai saat `override_manual=true`; bila `override_manual=false`, server mengabaikan field ini.
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Transaksi konsultan berhasil diperbarui.
 *       '400':
 *         description: Payload tidak valid atau field yang dilarang ikut dikirim.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus transaksi konsultan
 *     description: |
 *       Soft delete secara default. Gunakan query `?hard=true` untuk hard delete.
 *       Data tidak bisa dihapus bila periode terkunci atau transaksi sudah diposting ke payroll.
 *     tags: [Admin - Transaksi Konsultan]
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
 *         description: Transaksi konsultan berhasil dihapus.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Data tidak dapat dihapus karena status bisnis.
 *       '500':
 *         description: Terjadi kesalahan server.
 */
