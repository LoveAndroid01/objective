/**
 * Created by Layman <anysome@gmail.com> (http://github.com/anysome) on 16/7/14.
 */
import React from 'react';
import {StyleSheet, ScrollView, View, Text, ListView, Image} from 'react-native';
import moment from 'moment';

import {airloy, styles, colors, api, toast, L} from '../../app';

export default class Happiness extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      reward: {
        score: '我想想...',
        fruit9: '*',
        fruit8: '*',
        fruit1: '*',
        fruit: '*'
      },
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      })
    };
  }

  componentDidMount() {
    this.reload();
  }

  async reload() {
    let result = await airloy.net.httpGet(api.reward.total);
    if (result.success) {
      this.setState({
        reward: result.info
      });
    } else {
      toast(L(result.message));
    }
    let result2 = await airloy.net.httpGet(api.reward.list);
    if (result2.success) {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(result2.info)
      });
    } else {
      toast(L(result2.message));
    }
  }

  _renderRow(rowData, sectionId, rowId) {
    return (
      <View style={style.row}>
        <Text style={style.score}>+ {rowData.score}</Text>
        <View style={style.containerR}>
          {rowData.fruit9 > 0 &&
          <Image style={style.fruitSmall}
                 source={require('../../../resources/images/apple.png')}/>
          }
        </View>
        <View style={style.containerR}>
          {rowData.fruit8 > 0 && [
            <Text key={rowData.id + '-txt'} style={styles.text}>{rowData.fruit8}</Text>,
            <Image key={rowData.id + '-img'} style={style.fruitSmall}
                   source={require('../../../resources/images/berry.png')}/>
          ]}
        </View>
        <View style={style.containerR}>
          {rowData.fruit1 > 0 && [
            <Text key={rowData.id + '-txt'} style={styles.text}>{rowData.fruit1}</Text>,
            <Image key={rowData.id + '-img'} style={style.fruitSmall}
                   source={require('../../../resources/images/pear.png')}/>
          ]}
        </View>
        <Text style={styles.hint}>{moment(rowData.today).format('YYYY-MM-DD')}</Text>
      </View>
    );
  }

  _renderSeparator(sectionId, rowId, adjacentRowHighlighted) {
    return <View key={rowId + '_separator'} style={styles.hr}></View>
  }

  render() {
    return (
      <ScrollView>
        <View style={styles.section}>
          <View style={style.indexRow}>
            <Text style={style.bigText}>{this.state.reward.score}</Text>
            <Text style={style.hint}>完成待办: {this.state.reward.fruit}</Text>
          </View>
          <View style={styles.sectionRow}>
            <View style={style.containerH}>
              <Text style={styles.text}>{this.state.reward.fruit9}</Text>
              <Image style={style.fruit}
                     source={require('../../../resources/images/apple.png')}/>
            </View>
            <View style={style.containerH}>
              <Text style={styles.text}>{this.state.reward.fruit8}</Text>
              <Image style={style.fruit}
                     source={require('../../../resources/images/berry.png')}/>
            </View>
            <View style={style.containerH}>
              <Text style={styles.text}>{this.state.reward.fruit1}</Text>
              <Image style={style.fruit}
                     source={require('../../../resources/images/pear.png')}/>
            </View>
          </View>
        </View>
        <ListView style={{marginTop: 20}} enableEmptySections={true}
                  initialListSize={10}
                  pageSize={5}
                  dataSource={this.state.dataSource}
                  renderRow={this._renderRow}
                  renderSeparator={this._renderSeparator}
        />
      </ScrollView>
    );
  }
}


const colorHappy = '#ffc400';

const style = StyleSheet.create({
  indexRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10
  },
  bigText: {
    flex: 1,
    color: colorHappy,
    fontWeight: 'bold',
    fontSize: 56
  },
  containerH: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
    height: 40,
    alignItems: 'center',
    backgroundColor: 'white'
  },
  containerR: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 32
  },
  fruit: {
    marginLeft: 4,
    tintColor: colors.action
  },
  hint: {
    fontSize: 12,
    textAlign: 'right',
    color: colors.border,
    marginBottom: 12
  },
  fruitSmall: {
    width: 20,
    height: 20,
    marginLeft: 2,
    tintColor: colors.action
  },
  score: {
    width: 50,
    color: colorHappy,
    fontWeight: 'bold',
    fontSize: 14
  }
});
