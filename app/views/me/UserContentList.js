/**
 * Created by Layman(http://github.com/anysome) on 16/3/4.
 */
import React from 'react';
import {StyleSheet, ListView, RefreshControl, View, Text, TouchableOpacity, PixelRatio} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import moment from 'moment';

import {airloy, styles, colors, config, api, toast, L} from '../../app';
import util from '../../libs/Util';
import objective from '../../logic/Objective';
import ListSource from '../../logic/ListSource';

import Content from '../discover/Content';

export default class UserContentList extends React.Component {

  constructor(props) {
    super(props);
    this.listSource = new ListSource();
    this.state = {
      isRefreshing: true,
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      }),
      selectedRow: {},
      showModal: false
    };
    this._renderRow = this._renderRow.bind(this);
  }

  componentDidMount() {
    this.reload();
  }

  async reload() {
    this.setState({
      isRefreshing: true
    });
    let result = await airloy.net.httpGet(api.content.list.user, {userId: this.props.userId});
    if (result.success) {
      this.listSource = new ListSource(result.info);
      this.setState({
        isRefreshing: false,
        dataSource: this.state.dataSource.cloneWithRows(this.listSource.datas)
      });
    } else {
      result.message !== 'error.request.auth' && this.setState({
        isRefreshing: false
      });
      toast(L(result.message));
    }
    console.log(' load content list');
  }

  _pressRow(rowData) {
    this.setState({
      showModal: true,
      selectedRow: rowData
    });
  }

  updateRow(rowData) {
    if (rowData) {
      // force the row view to update
      this.listSource.update(util.clone(rowData));
      this.setState({
        showModal: false,
        dataSource: this.state.dataSource.cloneWithRows(this.listSource.datas)
      });
    } else {
      this.setState({
        showModal: false
      });
    }
  }

  async _like(rowData) {
    let result = await airloy.net.httpGet(api.content.detail.like, {id: rowData.id});
    if (result.success) {
      if (result.info > -1) {
        rowData.likes = rowData.likes + 1;
        this.listSource.update(util.clone(rowData));
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(this.listSource.datas)
        });
      }
    } else {
      toast(L(result.message));
    }
  }

  _renderRow(rowData, sectionId, rowId, highlightRow) {
    let log = rowData.log ? rowData.log : false;
    let checkDaily = rowData.content ? JSON.parse(rowData.content) : {};
    return (
      <TouchableOpacity style={style.row} onPress={() => this._pressRow(rowData)}>
        {log && <Text style={styles.text}>{rowData.log}</Text>}
        <View style={style.container}>
          <Text style={style.text}>{checkDaily.title}</Text>
          <Text style={style.times}>
            {`${checkDaily.total} + ${checkDaily.times} ${objective.getUnitName(checkDaily.unit)}`}
          </Text>
        </View>
        <View style={styles.containerH}>
          <Text style={style.count}>{rowData.comments}</Text>
          <Icon size={20} name='md-text' color={colors.light2} style={style.icon}/>
          <Text style={style.count}>{rowData.likes}</Text>
          <TouchableOpacity onPress={() => this._like(rowData)}>
            <Icon size={20} name='ios-heart' color={colors.light2} style={style.icon}/>
          </TouchableOpacity>
          <Text style={style.hint}>{moment(rowData.createTime).calendar()}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  render() {
    return (
      <View style={styles.flex}>
        <ListView enableEmptySections={true}
                  initialListSize={15}
                  pageSize={5}
                  dataSource={this.state.dataSource}
                  renderRow={this._renderRow}
                  refreshControl={<RefreshControl refreshing={this.state.isRefreshing}
                                                          onRefresh={() => this.reload()}
                                                          tintColor={colors.accent}
                                                          title="加载中..."
                                                          colors={['#ff0000', '#00ff00', '#0000ff']}
                                                          progressBackgroundColor="#EBEBEB" />}
        />
        <Content data={this.state.selectedRow} visible={this.state.showModal}
                 onFeedback={(rowData) => this.updateRow(rowData)}/>
      </View>
    );
  }
}

const style = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.light1,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 20,
    borderTopWidth: 1 / PixelRatio.get(),
    borderTopColor: colors.light3,
    borderBottomWidth: 1 / PixelRatio.get(),
    borderBottomColor: colors.light3
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light3,
    padding: 8,
    marginTop: 5,
    marginBottom: 5,
    borderRadius: 5,
    borderColor: colors.light2,
    borderWidth: 1 / PixelRatio.get()
  },
  text: {
    flex: 1,
    color: colors.dark1,
    fontSize: 14
  },
  times: {
    textAlign: 'right',
    fontSize: 12,
    color: colors.dark2
  },
  icon: {
    marginLeft: 8,
    marginRight: 16
  },
  hint: {
    flex: 1,
    fontSize: 12,
    paddingTop: 4,
    textAlign: 'right',
    color: colors.dark1
  },
  count: {
    fontSize: 14,
    color: colors.border
  }
});
