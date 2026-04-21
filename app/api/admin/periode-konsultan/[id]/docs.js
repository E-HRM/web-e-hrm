/**
 * @swagger
 * /api/admin/periode-konsultan/{id}:
 *   get:
 *     summary: Detail periode konsultan
 *     description: Mengambil detail satu periode konsultan berdasarkan ID.
 *     tags: [Admin - Periode Konsultan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID periode konsultan.
 *     responses:
 *       '200':
 *         description: Detail periode konsultan ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PeriodeKonsultan'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui periode konsultan
 *     description: Memperbarui periode konsultan berdasarkan ID. Jika `tahun` dan `bulan` diubah, kombinasi tersebut tidak boleh bentrok dengan data lain.
 *     tags: [Admin - Periode Konsultan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID periode konsultan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tahun:
 *                 type: integer
 *                 minimum: 2000
 *                 maximum: 9999
 *               bulan:
 *                 type: string
 *                 enum: [JANUARI, FEBRUARI, MARET, APRIL, MEI, JUNI, JULI, AGUSTUS, SEPTEMBER, OKTOBER, NOVEMBER, DESEMBER]
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *               status_periode:
 *                 type: string
 *                 enum: [DRAFT, DIREVIEW, DISETUJUI, TERKUNCI]
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Periode konsultan berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PeriodeKonsultan'
 *       '400':
 *         description: Payload tidak valid atau kosong.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Kombinasi tahun dan bulan sudah digunakan oleh data lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus periode konsultan
 *     description: Secara default melakukan soft delete pada periode konsultan dan juga soft delete untuk `transaksi_konsultan` serta `payout_konsultan` yang terkait. Tambahkan query `hard=true` atau `force=true` untuk hard delete permanen.
 *     tags: [Admin - Periode Konsultan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID periode konsultan.
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
 *                   $ref: '#/components/schemas/PeriodeKonsultan'
 *                 cascade_summary:
 *                   type: object
 *                   properties:
 *                     transaksi_konsultan_soft_deleted:
 *                       type: integer
 *                     payout_konsultan_soft_deleted:
 *                       type: integer
 *                 relation_summary:
 *                   type: object
 *                   properties:
 *                     transaksi_konsultan_terhapus_mengikuti_cascade:
 *                       type: integer
 *                     payout_konsultan_terhapus_mengikuti_cascade:
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

const adminPeriodeKonsultanIdDocs = {};

export default adminPeriodeKonsultanIdDocs;
