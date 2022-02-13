'use strict';

let DataTypes = CT.Sequelize.DataTypes;

module.exports = CT.db.define('report', {
        id: {
            type: DataTypes.BIGINT(40),
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        address: {
            type: DataTypes.STRING(64),
            field: 'address',
            allowNull: false,
        },
        reportSlot: {
            type: DataTypes.BIGINT(32),
            field: 'report_slot',
            allowNull: true,
        },
        spower: {
            type: DataTypes.BIGINT(32),
            field: 'spower',
            allowNull: true,
        },
        free: {
            type: DataTypes.BIGINT(48),
            field: 'free',
            allowNull: true,
        },
        reportedFilesSize: {
            type: DataTypes.BIGINT(48),
            field: 'reported_files_size',
            allowNull: true,
        },
        reportedSrdRoot: {
            type: DataTypes.STRING(1024),
            field: 'reported_srd_root',
            allowNull: true,
        },
        reportedFilesRoot: {
            type: DataTypes.STRING(1024),
            field: 'reported_files_root',
            allowNull: true,
        },
        punishmentDeadline: {
            type: DataTypes.INTEGER(11),
            field: 'punishment_deadline',
            allowNull: true,
        },
        reportTime: {
            type: DataTypes.INTEGER(11),
            field: 'report_time',
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.INTEGER(11),
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.INTEGER(11),
            field: 'updated_at'
        }
    },
    {
        createdAt: false,
        updatedAt: false,
        tableName: `${CT.constant.TABLE_PREFIX}report`,
        comment: 'report',
        indexes: [
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['address'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['report_slot'],
            },
        ],
    });