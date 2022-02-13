'use strict';

let DataTypes = CT.Sequelize.DataTypes;

module.exports = CT.db.define('account', {
        id: {
            type: DataTypes.BIGINT(20),
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(64),
            field: 'name',
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING(64),
            field: 'address',
        },
        meta: {
            type: DataTypes.STRING(2048),
            field: 'meta',
            allowNull: true,
        },
        blockHash: {
            type: DataTypes.STRING(512),
            field: 'block_hash',
            allowNull: true,
        },
        mnemonic: {
            type: DataTypes.STRING(1024),
            field: 'mnemonic',
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM(CT.constant.ACCOUNT_TYPE.TRANSFER, CT.constant.ACCOUNT_TYPE.REWARD),
            field: 'type',
            allowNull: false,
            defaultValue: CT.constant.ACCOUNT_TYPE.REWARD
        },
        source: {
            type: DataTypes.ENUM(CT.constant.ACCOUNT_SOURCE.IMPORT, CT.constant.ACCOUNT_SOURCE.BATCH),
            field: 'source',
            allowNull: false,
            defaultValue: CT.constant.ACCOUNT_SOURCE.BATCH
        },
        deleted: {
            type: DataTypes.INTEGER(11),
            field: 'deleted',
            allowNull: false,
            defaultValue: 0,
        },
        createdAt: {
            type: DataTypes.INTEGER(11),
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.INTEGER(11),
            field: 'updated_at'
        },
    },
    {
        createdAt: false,
        updatedAt: false,
        tableName: `${CT.constant.TABLE_PREFIX}account`,
        comment: '账户',
        indexes: [
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['name'],
            },
            {
                // name: '',
                type: 'UNIQUE',//, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['address'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['block_hash'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'BTREE',//BTREE and HASH
                unique: false,
                fields: ['source'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'BTREE',//BTREE and HASH
                unique: false,
                fields: ['type'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'BTREE',//BTREE and HASH
                unique: false,
                fields: ['deleted'],
            },
        ],
    });