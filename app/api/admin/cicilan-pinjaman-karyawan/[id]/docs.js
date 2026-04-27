/**
 * @swagger
 * /api/admin/cicilan-pinjaman-karyawan/{id}:
 *   get:
 *     summary: Detail cicilan pinjaman karyawan
 *     description: Mengambil detail satu cicilan pinjaman karyawan berdasarkan ID.
 *     tags: [Admin - Cicilan Pinjaman Karyawan]
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
 *         description: Detail cicilan pinjaman karyawan ditemukan.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui cicilan pinjaman karyawan
 *     description: |
 *       Memperbarui cicilan pinjaman karyawan berdasarkan ID.
 *       Cicilan yang sudah dibayar atau terhubung ke payroll berstatus `DIBAYAR`
 *       tidak bisa diubah lagi. Setelah update, saldo pinjaman induk dihitung ulang.
 *     tags: [Admin - Cicilan Pinjaman Karyawan]
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
 *               id_pinjaman_karyawan:
 *                 type: string
 *               id_payroll_karyawan:
 *                 type: string
 *                 nullable: true
 *               jatuh_tempo:
 *                 type: string
 *                 format: date
 *               nominal_tagihan:
 *                 type: string
 *                 example: '1000000.00'
 *               nominal_terbayar:
 *                 type: string
 *                 example: '0.00'
 *               status_cicilan:
 *                 type: string
 *                 enum: [MENUNGGU, DIPOSTING, DIBAYAR, DILEWATI]
 *               diposting_pada:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               dibayar_pada:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Cicilan pinjaman karyawan berhasil diperbarui.
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
 *     summary: Hapus cicilan pinjaman karyawan
 *     description: |
 *       Soft delete secara default. Tambahkan query `hard=true` atau `force=true`
 *       untuk hard delete permanen. Cicilan yang sudah dibayar atau sudah masuk ke
 *       payroll yang berstatus `DIBAYAR` tidak dapat dihapus.
 *       Setelah delete, saldo pinjaman induk dihitung ulang.
 *     tags: [Admin - Cicilan Pinjaman Karyawan]
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
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['0', '1', 'true', 'false']
 *         description: Hard delete permanen jika bernilai truthy.
 *     responses:
 *       '200':
 *         description: Cicilan pinjaman karyawan berhasil dihapus.
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
