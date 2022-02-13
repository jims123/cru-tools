'use strict';

let DataTypes = CT.Sequelize.DataTypes;

module.exports = CT.db.define('eraReward', {
        id: {
            type: DataTypes.BIGINT(20),
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        eraIndex: {
            type: DataTypes.BIGINT(32),
            field: 'era_index',
            allowNull: false,
        },
        partialFee: {
            type: DataTypes.BIGINT(32),
            field: 'partial_fee',
            allowNull: false,
        },
        ownerAddress: {
            type: DataTypes.STRING(64),
            field: 'owner_address',
            allowNull: false,
        },
        callAddress: {
            type: DataTypes.STRING(64),
            field: 'call_address',
            allowNull: false,
        },
        txHash: {
            type: DataTypes.STRING(512),
            field: 'tx_hash',
            allowNull: true,
            defaultValue: ''
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
        tableName: `${CT.constant.TABLE_PREFIX}era_reward`,
        comment: 'eraReward',
        indexes: [
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['era_index'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['partial_fee'],
            },
        ],
    });