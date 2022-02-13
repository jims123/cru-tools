'use strict';

let DataTypes = CT.Sequelize.DataTypes;

module.exports = CT.db.define('sysCfg', {
        id: {
            type: DataTypes.BIGINT(20),
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        keyName: {
            type: DataTypes.STRING(64),
            field: 'key_name',
            allowNull: false,
        },
        keyValue: {
            type: DataTypes.STRING(256),
            field: 'key_value',
        },
        keyDesc: {
            type: DataTypes.STRING(512),
            field: 'key_desc',
        },
        keyType: {
            type: DataTypes.STRING(32),
            field: 'key_type',
        },
        createdAt: {
            type: DataTypes.INTEGER(11),
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.INTEGER(11),
            field: 'updated_at'
        },
        cfgValue: {
            type: DataTypes.VIRTUAL,
            get: function () {
                try {
                    switch (this.get('keyType')) {
                        case CT.constant.SYSTEM_CONFIG_KEY_TYPE.NUMBER:
                            return parseInt(this.get('keyValue'));
                        case CT.constant.SYSTEM_CONFIG_KEY_TYPE.FLOAT:
                            return parseFloat(this.get('keyValue'));
                        case CT.constant.SYSTEM_CONFIG_KEY_TYPE.STRING:
                            return this.get('keyValue');
                        case CT.constant.SYSTEM_CONFIG_KEY_TYPE.BOOLEAN:
                            return new Boolean(this.get('keyValue'));
                        case CT.constant.SYSTEM_CONFIG_KEY_TYPE.JSON:
                            return JSON.parse(this.get('keyValue'));
                        case CT.constant.SYSTEM_CONFIG_KEY_TYPE.ARRAY:
                            return this.get('keyValue').split(',');
                    }
                } catch (err) {
                    console.error(err);
                    return null;
                }
            }
        }
    },
    {
        createdAt: false,
        updatedAt: false,
        tableName: `${CT.constant.TABLE_PREFIX}cys_cfg`,
        comment: '系统配置',
        indexes: [
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['key_name'],
            },
            {
                // name: '',
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['key_value'],
            }
        ],
    });